use crate::{
    completion::ArcCompletionEngine,
    completion::{Completion, CompletionError, CompletionQuery, CompletionQueryBuilder},
    debug,
    tree::CompletionLevels,
};
use tokio::task::JoinHandle;

/// The context for the program.
/// Splits into different strategies.
pub struct MainCtx {
    pub engine: ArcCompletionEngine,
    pub file_contents: String,
    pub num_comps: usize,
    pub retries: usize,
    pub fallback: bool,
    pub stop_at: usize,
    pub disable_type_check: bool,
    pub enable_defgen: bool,
}

impl MainCtx {
    /// Returns the subset of completions that type check from the given set of completions
    async fn type_check_candidates(&self, candidates: Vec<Completion>) -> Vec<Completion> {
        println!(" --- Type Checking {} Candidates ---", candidates.len());
        let mut comps: Vec<Completion> = vec![];
        let mut handles: Vec<JoinHandle<Option<Completion>>> = vec![];
        for (i, candidate) in candidates.into_iter().enumerate() {
            debug!("candidate {}:\n{}", i, candidate.code);
            let lang_client = self.engine.get_ls();
            let disable_type_check = self.disable_type_check;
            handles.push(tokio::task::spawn(async move {
                // this is kind of a hack, but it's the easiest way to get the
                // `self.stop_at` to work well without code duplication
                if disable_type_check {
                    return Some(candidate);
                }

                let type_checks = lang_client.type_check(&candidate.code).await.unwrap();
                if type_checks {
                    Some(candidate)
                } else {
                    None
                }
            }));
        }

        for handle in handles {
            if let Some(comp) = handle.await.unwrap() {
                comps.push(comp);
            }
            if comps.len() >= self.stop_at {
                break;
            }
        }

        comps
    }
}

#[async_trait::async_trait]
pub trait MainStrategy {
    /// Run the strategy on the given context. The program will exit with code 1 if
    /// there are any errors.
    async fn run(&self, context: MainCtx) -> Vec<Completion>;
}

pub struct TreeStrategy;
pub struct SimpleStrategy;

#[async_trait::async_trait]
impl MainStrategy for TreeStrategy {
    /// Runs the tree completion strategy. Documentation on the strategy is in the `tree.rs` file.
    ///
    /// TODO: somehow add caching to this strategy, maybe go up the tree?
    async fn run(&self, context: MainCtx) -> Vec<Completion> {
        let tree = context
            .engine
            .get_ls()
            .to_tree(&context.file_contents)
            .await
            .unwrap();

        let levels = CompletionLevels::new(context.retries, context.num_comps, context.fallback)
            .prepare(tree, context.engine.get_ls())
            .await
            .unwrap();
        let completed = levels
            .tree_complete(context.engine.clone())
            .await
            .disassemble();

        // score the code at the root
        let mut handles: Vec<JoinHandle<Completion>> = vec![];
        for code in completed {
            let ls = context.engine.get_ls();
            handles.push(tokio::task::spawn(async move {
                let (_, score) = ls
                    .check_complete(&code, &code)
                    .await
                    .unwrap_or((false, 1000));
                Completion {
                    code,
                    score,
                    fallbacked: false,
                }
            }));
        }
        let mut candidates = vec![];
        for handle in handles {
            let comp = handle.await.unwrap();
            candidates.push(comp);
        }

        // sort by lowest score first
        candidates.sort_by(|a, b| a.score.partial_cmp(&b.score).unwrap());

        context.type_check_candidates(candidates).await
    }
}

#[async_trait::async_trait]
impl MainStrategy for SimpleStrategy {
    /// Runs the simple completion strategy, which just runs the completion on the given file
    /// without any transformation, other than adding "_hole_" to each unknwon type
    async fn run(&self, context: MainCtx) -> Vec<Completion> {
        let printed = context
            .engine
            .get_ls()
            .pretty_print(&context.file_contents, "_hole_")
            .await
            .unwrap();

        debug!("pretty:\n{}", printed);

        let query = CompletionQueryBuilder::new(printed)
            .num_comps(context.num_comps)
            .retries(context.retries)
            .fallback(context.fallback)
            .build();

        let candidates = match context.engine.complete(query.clone()).await {
            Ok(r) => r,
            Err(CompletionError::RateLimit(r)) if !r.is_empty() => {
                eprintln!(
                    "Rate limited, but got {} canditate completions before.",
                    r.len()
                );
                r
            }
            Err(e) => {
                eprintln!("Fatal error: {e}");
                std::process::exit(1);
            }
        };

        let comps: Vec<Completion> = context.type_check_candidates(candidates).await;

        // cache the type-checked completions if we have a cache
        if let Some(mut cache) = context.engine.get_cache().await {
            // we want to get all the completions that are typechecked
            // except the one that fallbacked (if there is any)
            let comps_no_fallback = comps
                .iter()
                .filter(|c| !c.fallbacked)
                .map(|c| c.code.clone())
                .collect::<Vec<String>>();

            if !comps_no_fallback.is_empty() {
                cache
                    .store(&query, &comps_no_fallback)
                    .expect("failed to store in cache");
            }
        }

        comps
    }
}
