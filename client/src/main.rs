use std::sync::Arc;

use codex_types::{
    cache::Cache,
    completion::{
        codex::{CodexClientBuilder},
        ArcCompletionEngine, CompletionEngine,
    },
    completion::{Completion, CompletionError, CompletionQuery},
    debug,
    langserver::{py::PyServer, ts::TsServer, LangServer},
    tree::{CompletionLevels, TreeCompletion},
};
use tokio::{sync::Mutex, task::JoinHandle};

use clap::Parser;

/// Program that uses OpenAI Codex for Gradual Type Inference
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    /// Codex tokens to use, separated by commas
    #[clap(short, long, value_parser)]
    tokens: String,

    /// The target language.
    /// Either `ts` or `py`
    #[clap(short, long, value_parser, default_value = "ts")]
    lang: String,

    /// The target file path
    #[clap(short, long, value_parser)]
    file: String,

    /// Output file directory path
    #[clap(short, long, value_parser)]
    output: String,

    /// Completion strategy. Either: {"simple": simple completion, "tree": tree completion}
    #[clap(short, long, value_parser, default_value = "simple")]
    strategy: String,

    /// The number of completions to return
    #[clap(short, long, value_parser, default_value = "3")]
    n: usize,

    /// The number of request to send to Codex
    #[clap(short, long, value_parser, default_value = "1")]
    retries: usize,

    /// Whether to fallback to "any" or not
    #[clap(long, value_parser, default_value_t = false)]
    fallback: bool,

    /// The url of the codex endpoint
    #[clap(
        short,
        long,
        value_parser,
        default_value = "https://api.openai.com/v1/edits"
    )]
    endpoint: String,

    /// The temperature to use for the completion
    #[clap(long, value_parser, default_value_t = 1.0)]
    temp: f64,

    /// The maximum number of type-checkable completions to return
    #[clap(long, value_parser, default_value_t = 1)]
    stop_at: usize,

    /// The Redis URL for the cache
    #[clap(short, long, value_parser)]
    cache: Option<String>,

    /// Whether or not to prevent rate limits. You may want to set this to false if You
    /// are using your own model. By default, we try to prevent rate limits, by using
    /// this flag you can disable this behavior.
    #[clap(long, value_parser, default_value_t = false)]
    disable_rate_limit: bool,

    /// The maximum type-quality score for a completion to be valid (lower means better quality)
    #[clap(long, short, value_parser, default_value_t = 9999999)]
    max_type_quality: i64,
}

impl Args {
    async fn lang_client(&self) -> Arc<dyn LangServer + Send + Sync> {
        fn get_path(folder: String) -> String {
            std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .parent()
                .unwrap()
                .join(folder)
                .to_str()
                .unwrap()
                .to_string()
        }
        match self.lang.as_str() {
            "ts" => {
                let path = get_path("ts-ast".to_string());
                Arc::new(
                    TsServer::make(&path)
                        .await
                        .expect("failed to make ts server"),
                )
            }
            "py" => {
                let path = get_path("py-ast".to_string());
                Arc::new(
                    PyServer::make(&path)
                        .await
                        .expect("failed to make py server"),
                )
            }
            _ => {
                eprintln!("Unknown language, {}", self.lang);
                std::process::exit(1);
            }
        }
    }
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    let lang_client = args.lang_client().await;

    let file_contents = tokio::fs::read_to_string(&args.file).await.unwrap();

    let cache: Option<Arc<Mutex<Cache>>> = args.cache.map(|u| {
        Arc::new(Mutex::new(Cache::new(&u, args.stop_at).unwrap_or_else(
            |e| {
                eprintln!("Failed to connect to redis: {e}");
                std::process::exit(1);
            },
        )))
    });

    let tokens = args
        .tokens
        .split(',')
        .map(|s| s.to_string())
        .collect::<Vec<_>>();

    let mut codex = CodexClientBuilder::new(tokens, lang_client);
    codex
        .endpoint(args.endpoint)
        .temperature(args.temp)
        .max_type_score(args.max_type_quality)
        .rate_limit(!args.disable_rate_limit);

    if let Some(cache) = cache {
        codex.cache(cache);
    }

    let codex = codex.build();

    let ctx = MainCtx {
        file_contents,
        engine: Arc::new(codex), // TODO: add option for different engines
        num_comps: args.n,
        retries: args.retries,
        fallback: args.fallback,
        stop_at: args.stop_at,
    };

    // the typechecked and completed code(s). here if we get errors we exit with 1
    let good_ones: Vec<Completion> = match args.strategy.as_str() {
        "simple" => ctx.simple_strategy().await,
        "tree" => ctx.tree_strategy().await,
        _ => {
            eprintln!("Unknown strategy, {}", args.strategy);
            std::process::exit(1);
        }
    };

    if good_ones.is_empty() {
        eprintln!("No completions type checked");
        std::process::exit(1);
    }

    println!("Number of type-checking completions: {}", good_ones.len());

    // if the completed dir does not exist, create it
    let output_dir = std::path::Path::new(&args.output);
    if !output_dir.exists() {
        tokio::fs::create_dir_all(output_dir).await.unwrap();
    }

    // write to the output dir
    for (i, comp) in good_ones.into_iter().enumerate() {
        let fallback = if comp.fallbacked { "_fallback" } else { "" };
        let output_path = format!(
            "{}/{}_score_{}{}.{}",
            args.output, i, comp.score, fallback, args.lang
        );
        tokio::fs::write(&output_path, comp.code).await.unwrap();
    }
}

/// The context for the program.
/// Splits into different strategies.
struct MainCtx {
    engine: ArcCompletionEngine,
    file_contents: String,
    num_comps: usize,
    retries: usize,
    fallback: bool,
    stop_at: usize,
}

impl MainCtx {
    /// Returns the subset of completions that type check from the given set of completions
    async fn type_check_candidates(&self, candidates: Vec<Completion>) -> Vec<Completion> {
        let mut comps: Vec<Completion> = vec![];
        let mut handles: Vec<JoinHandle<Option<Completion>>> = vec![];
        for (i, candidate) in candidates.into_iter().enumerate() {
            debug!("candidate {}:\n{}", i, candidate.code);
            let lang_client = self.engine.get_ls();
            handles.push(tokio::task::spawn(async move {
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
    /// Runs the tree completion strategy. Documentation on the strategy is in the `tree.rs` file.
    async fn tree_strategy(&self) -> Vec<Completion> {
        let tree = self
            .engine
            .get_ls()
            .to_tree(&self.file_contents)
            .await
            .unwrap();

        let mut levels: CompletionLevels = CompletionLevels::prepare(tree, self.engine.get_ls())
            .await
            .unwrap();
        levels.num_comps = self.num_comps;
        levels.retries = self.retries;
        levels.fallback = self.fallback;

        levels.tree_complete(self.engine.clone()).await;

        let root = levels.levels[0].nodes.remove(0);

        // score the code at the root
        let mut handles: Vec<JoinHandle<Completion>> = vec![];
        for code in root.completed {
            let ls = self.engine.get_ls();
            handles.push(tokio::task::spawn(async move {
                let (_, score) = ls
                    .check_complete(&code, &code)
                    .await
                    .unwrap_or((false, 9999999999999));
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

        self.type_check_candidates(candidates).await
    }

    /// Runs the simple completion strategy, which just runs the completion on the given file
    /// without any transformation, other than adding "_hole_" to each unknwon type
    async fn simple_strategy(self) -> Vec<Completion> {
        let printed = self
            .engine
            .get_ls()
            .pretty_print(&self.file_contents, "_hole_")
            .await
            .unwrap();

        debug!("pretty:\n{}", printed);

        let query = CompletionQuery::new(printed, self.num_comps, self.retries, self.fallback);

        let candidates = match self.engine.complete(query.clone()).await {
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

        let comps: Vec<Completion> = self.type_check_candidates(candidates).await;

        // cache the type-checked completions if we have a cache
        if let Some(mut cache) = self.engine.get_cache().await {
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
