use std::{
    cmp::Ordering,
    collections::{HashMap, HashSet, VecDeque},
    sync::Arc,
};

use serde::{Deserialize, Serialize};
use tokio::task::JoinHandle;

use crate::{
    completion::{
        ArcCompletionEngine, Completion, CompletionError, CompletionQuery, CompletionQueryBuilder,
    },
    langserver::{AnnotateType, CheckProblem},
};
use crate::{
    debug,
    langserver::{ArcLangServer, LangServerError},
};

/// A codeblock tree, taken from the `tree` command of the language server
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CodeBlockTree {
    /// NOTE: this is a generated name, not the original name.
    /// If this starts with "topnode", it's a toplevel node, and usages should not be emitted.
    pub name: String,
    pub code: String,
    pub children: Vec<CodeBlockTree>,
}

impl CodeBlockTree {
    /// Depth-limits the given code block tree to the given depth
    pub fn depth_limit(&mut self, depth: usize) {
        if depth == 0 {
            self.children = vec![];
        } else {
            for child in self.children.iter_mut() {
                child.depth_limit(depth - 1);
            }
        }
    }
}

/// tree compeltion algo v2 (more expensive but more accurate):
/// - Step 1: make the code block tree out of the original input code.
/// - Step 2: make a nested array of code blocks, where the outer array index is the
///   level of the blocks at the array of that index. every element of the inner arrays is a tuple
///   of (children_idxs: Vec<usize>, name: String, code: String, completed: Vec<String>).
///   where `code` is the original code of the code block.
/// - Step 3: we start at the deepest level of the array, and we complete the code blocks
///   at the level.
/// - Step 4: we then go to a level above, and for each node, substitute the stub of the code block
///   blocks bellow of the children for each code in the vec. we then complete the code blocks at the level.
/// - Step 5: we repeat step 4 until we reach the root level. we have a completed code block tree.
/// - Step 6: we disassemble the code block tree and substitute the completed types into the original
///   code. we type check the code, and if it passes, we return the code. if it fails, we go to step 3.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CompNode {
    pub children_idxs: Vec<usize>,
    pub name: String,
    pub code: String,
    pub completed: Vec<String>,
    pub usages: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CompLevel {
    pub nodes: Vec<CompNode>,
}

// these are states that the completion levels can be in.
// this is used to enforce the state machine of the completion levels, and to prevent
// the user from calling methods on the completion levels in the wrong order.
//
// new -> prepare -> tree_complete -> disassemble
pub struct NewState;
pub struct PreparedState;
pub struct CompletedState;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
struct HyperParams {
    // we propagate these query params to the completion queries
    retries: usize,
    num_comps: usize,
    fallback: bool,
    // if we want to create usages block or not
    usages: bool,
    // stop_at hyperparam
    stop_at: usize,
    // the kind of types that need to be annotated
    types: Vec<AnnotateType>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CompletionLevels<State = NewState> {
    levels: Vec<CompLevel>,
    params: HyperParams,
    // this is the state of the completion levels
    state: std::marker::PhantomData<State>,
}

impl CompletionLevels<NewState> {
    /// Creates a new completion levels, with the given number of retries, number of completions,
    /// and whether to fallback to the `any` type.
    pub fn new(
        retries: usize,
        num_comps: usize,
        fallback: bool,
        usages: bool,
        stop_at: usize,
        types: Vec<AnnotateType>,
    ) -> Self {
        Self {
            levels: vec![],
            params: HyperParams {
                retries,
                num_comps,
                fallback,
                usages,
                stop_at,
                types,
            },
            state: std::marker::PhantomData,
        }
    }

    /// Prepares the completion levels to be completed for the given codeblock tree
    pub async fn prepare(
        self,
        tree: CodeBlockTree,
        langsever: ArcLangServer,
    ) -> Result<CompletionLevels<PreparedState>, LangServerError> {
        // dynamic programming solution. took me a while to figure out how to do this.

        // here we have the levels of the tree
        let mut levels = vec![];
        // this is a memoization table, where we store the nodes of the tree at each level,
        // with the children idx that need to be patched in the level after
        let mut nodes = vec![CompNode {
            children_idxs: vec![],
            name: tree.name,
            code: tree.code,
            completed: vec![],
            usages: String::new(), // no usages for root..
        }];
        // here we store the children of the nodes, and the idx of the node that they belong to
        let mut p_children = vec![(0, tree.children)];

        while !nodes.is_empty() {
            // we push the level of nodes that we got the iteration before
            levels.push(CompLevel { nodes });
            // new nodes!
            nodes = vec![];

            // new children memoization, that we build up in this iteration
            let mut new_children = vec![];
            // for each node
            for (p_idx, children) in p_children {
                // for each children
                for child in children {
                    // the idx of the level that we will be patching in the next iteration
                    let idx = nodes.len();

                    // we patch the children idxs of the parent of the children
                    let level = levels.len() - 1;
                    let parent = levels.get_mut(level).unwrap().nodes.get_mut(p_idx).unwrap();
                    parent.children_idxs.push(idx);

                    // we get the usages of this node, from the parent
                    let usages = if self.params.usages && !child.name.starts_with("topnode") {
                        langsever.usages(&parent.code, &child.code).await?
                    } else {
                        String::new()
                    };

                    // push unpatched node
                    nodes.push(CompNode {
                        children_idxs: vec![],
                        name: child.name,
                        code: child.code,
                        completed: vec![],
                        usages,
                    });
                    // push children
                    new_children.push((idx, child.children));
                }
            }
            // reassign children
            p_children = new_children;
        }
        Ok(CompletionLevels {
            levels,
            params: self.params,
            state: std::marker::PhantomData,
        })
    }
}

/// Strategy for merging the level below into the level above. Utilizes all possible combinations
/// between the level below and the level above.
/// NOTE: This could lead to a lot of permutations, and a state explosion. We need to be careful with this.
async fn merge_below_all_combs(
    child: &CompNode,
    level: usize,
    prompts_set: &mut HashSet<String>,
    ls: &ArcLangServer,
) {
    // make all possible combinations between prompt elements and
    // child.completed elements
    let mut new_prompts = HashSet::new();
    for (p_i, parent_code) in prompts_set.iter().enumerate() {
        for (c_i, child_code) in child.completed.iter().enumerate() {
            debug!(
                "weaving child({}) {c_i} into parent {p_i} (max p: {}, max c: {})",
                child.name,
                prompts_set.len(),
                child.completed.len()
            );
            let comp = ls
                // we take the min because at level 0 we have the root node
                // and we want to weave at nettle_level 0
                .weave(parent_code, child_code, std::cmp::min(1, level))
                .await
                .unwrap();
            new_prompts.insert(comp);
        }
    }

    *prompts_set = new_prompts;
}

fn count_all_possible_combs(child: &CompNode, curr_prompts: usize) -> usize {
    let mut res = 1;
    for _ in 0..curr_prompts {
        res *= child.completed.len();
    }
    res
}

// evenly distribute the stop_at parameter across a given number of children.
// Uses dynamic programming to find the optimal distribution.
// For example, if we have stop_at 10, and 3 children, we want to distribute
// [4, 3, 3] completions to each child.
// Another example, if we have stop_at 10, and 4 children, we want to distribute
// [3, 3, 2, 2] completions to each child.
fn distribute_stop_at(stop_at: usize, num_children: usize) -> Vec<usize> {
    let mut res = vec![0; num_children];
    let mut stop_at = stop_at;
    let mut i = 0;
    while stop_at > 0 {
        res[i] += 1;
        stop_at -= 1;
        i = (i + 1) % num_children;
    }
    res
}

fn all_combs(prompts: &HashSet<String>, comps: &[String]) -> Vec<(String, String)> {
    let mut res = Vec::new();
    for prompt in prompts.iter() {
        for comp in comps.iter() {
            res.push((prompt.clone(), comp.clone()));
        }
    }
    res
}

/// Strategy for merging the level below into the level above. Utilizes a random permutation
/// between the level below and the level above. Where earlier indexes in the children
/// are more likely to be chosen. This is because they are typically better completions.
///
/// # Panics
/// ASSUMES that the total number of combinations is greater than upper.
async fn merge_below_random_poisson(
    child: &CompNode,
    level: usize,
    // is our upper bound for the number of completions
    upper: usize,
    prompts_set: &mut HashSet<String>,
    ls: &ArcLangServer,
) {
    let mut new_prompts = HashSet::new();

    // 0.7 converges to this distribution:
    // 0: 50%
    // 1: 35%
    // 2: 12.5%
    // 3: 3%
    // 4: 0.5%
    // ...
    let poi = rand_distr::Poisson::new(0.7).unwrap();

    // NOTE: this is exponential, but it is contained in here, and the state
    // explosion does not travel up the tree, so it should be fine.
    let mut all_combs = all_combs(prompts_set, &child.completed);

    while new_prompts.len() < upper && !all_combs.is_empty() {
        let mut idx = {
            // need to make sure we drop this before an await
            // https://stackoverflow.com/questions/67443847/how-to-generate-random-numbers-in-async-rust
            let mut rng = rand::thread_rng();
            rand_distr::Distribution::sample(&poi, &mut rng) as usize
        };
        // adjust if we are out of bounds
        if idx >= all_combs.len() {
            idx = all_combs.len() - 1;
        }

        let (prompt, comp) = all_combs.remove(idx);
        let comp = ls
            // we take the min because at level 0 we have the root node
            // and we want to weave at nettle_level 0
            .weave(&prompt, &comp, std::cmp::min(1, level))
            .await
            .unwrap();
        new_prompts.insert(comp);
    }

    *prompts_set = new_prompts;
}

impl CompletionLevels<PreparedState> {
    async fn retry_query_until_ok(
        engine: &ArcCompletionEngine,
        q: CompletionQuery,
    ) -> Option<Vec<Completion>> {
        let mut res = engine.complete(q.clone()).await;
        let mut retries = 0;
        while res.is_err() {
            // if it's a rate limit, print out to stderr
            if let CompletionError::RateLimit(r) = res.unwrap_err() {
                eprintln!(
                    "Rate limited, but got {} canditate completions before.",
                    r.len()
                );
            }
            if retries > 5 {
                return None;
            }
            retries += 1;
            let q = q.clone();
            res = engine.complete(q).await;
        }
        Some(res.unwrap())
    }

    fn spawn_parallel_comp(
        params: &HyperParams,
        engine: ArcCompletionEngine,
        level: usize,
        prev_level: Arc<Option<Vec<CompNode>>>,
        node: CompNode,
    ) -> JoinHandle<(String, Vec<String>)> {
        let num_comps = params.num_comps;
        let retries = params.retries;
        let fallback = params.fallback;
        // we use stop_at as our upper bound for the number of completions
        let stop_at = params.stop_at;
        let types_to_annot = params.types.clone();

        tokio::task::spawn(async move {
            let mut prompts_set: HashSet<String> = HashSet::from([node.code.clone()]);
            // if we are not at a leaf, we need to patch the node with the children
            if !node.children_idxs.is_empty() {
                let level_below: &Vec<CompNode> = prev_level.as_ref().as_ref().unwrap();
                let num_children = node.children_idxs.len();

                // we need at least 1 completion for each child, so we
                // adjust the stop_at parameter accordingly
                let stop_at = std::cmp::max(stop_at, num_children);
                let stop_at_dist = distribute_stop_at(stop_at, num_children);
                for (child_idx, upper) in node.children_idxs.iter().zip(stop_at_dist) {
                    let child = level_below.get(*child_idx).unwrap_or_else(|| {
                        panic!(
                            "child_idx {} should be in level_below, which has len {}",
                            child_idx,
                            level_below.len()
                        )
                    });
                    let all_combs_num = count_all_possible_combs(child, prompts_set.len());
                    if all_combs_num > upper {
                        debug!(
                            "all_combs_num {} > upper {}, so we use random poisson",
                            all_combs_num, upper
                        );
                        merge_below_random_poisson(
                            child,
                            level,
                            upper,
                            &mut prompts_set,
                            &engine.get_ls(),
                        )
                        .await;
                    } else {
                        debug!(
                            "all_combs_num {} <= upper {}, so we use all combinations",
                            all_combs_num, upper
                        );
                        merge_below_all_combs(child, level, &mut prompts_set, &engine.get_ls())
                            .await;
                    }
                }
            }

            let prompts: Vec<String> = prompts_set.into_iter().collect();
            debug!("number of level prompts: {}", prompts.len());
            match level.cmp(&0) {
                Ordering::Greater => {
                    let ls = engine.get_ls();
                    let mut new_comps = HashSet::new(); // we don't care about duplicates
                    for prompt in prompts.iter() {
                        let stubbed = ls.stub(prompt).await.unwrap();
                        let mut printed = ls
                            .pretty_print(&stubbed, "_hole_", &types_to_annot)
                            .await
                            .unwrap();

                        // we add usages to the prompt
                        if !node.usages.is_empty() {
                            printed = format!("{}\n{}", printed, node.usages);
                        }

                        let q = CompletionQueryBuilder::new(printed)
                            .num_comps(num_comps)
                            .retries(retries)
                            .fallback(fallback)
                            // added comments are safe, we type-weave after
                            .problem_whitelist(vec![CheckProblem::ChangedComments])
                            .build();

                        debug!("query: {}", q.input);
                        let comps = Self::retry_query_until_ok(&engine, q).await;
                        match comps {
                            Some(comps) => {
                                for comp in comps {
                                    debug!("level comp: \n{}", comp.code);
                                    let rewoven = ls
                                        .weave(prompt, &comp.code, 0)
                                        .await
                                        .unwrap_or_else(|_| comp.code.clone());
                                    debug!("type-woven completion: \n{}", rewoven);
                                    new_comps.insert(rewoven);
                                }
                            }
                            None => {
                                debug!("Failed to get completions for query, skipping prompt.",);
                            }
                        }
                    }
                    (node.name, new_comps.into_iter().collect())
                }
                // if we are at root, we just want to disassemble the tree, no comps
                Ordering::Equal => (node.name, prompts),
                Ordering::Less => unreachable!(),
            }
        })
    }

    /// Completes the code block tree, mutating the tree in place.
    pub async fn tree_complete(
        mut self,
        engine: ArcCompletionEngine,
    ) -> CompletionLevels<CompletedState> {
        // we start at the deepest level of the array, and we complete the code blocks
        // at the level.
        let num_levels = self.levels.len();
        let mut prev_level: Arc<Option<Vec<CompNode>>> = Arc::new(None);
        for level in (0..num_levels).rev() {
            println!(" --- Tree Level: {level} / {} ---", num_levels - 1);
            let nodes = &mut self.levels.get_mut(level).unwrap().nodes;
            let num_nodes = nodes.len();
            let mut handles: Vec<JoinHandle<(String, Vec<String>)>> = vec![]; // node's (name, code)
            let mut lookup: HashMap<String, usize> = HashMap::new(); // node's name -> idx
            for (i, node) in nodes.iter().enumerate() {
                // copy stuff for the async closure
                let node = node.clone();
                let engine = engine.clone();
                let prev_level = prev_level.clone();

                // we store the idx of the node in the lookup table
                lookup.insert(node.name.clone(), i);

                // we concurrently complete the code blocks at the level.
                handles.push(Self::spawn_parallel_comp(
                    &self.params,
                    engine,
                    level,
                    prev_level,
                    node,
                ));
            }
            for (i, handle) in handles.into_iter().enumerate() {
                let (name, comps) = handle.await.unwrap();
                println!(
                    " - Completed {name}, Progress: {}/{} Nodes At Level {level} - ",
                    i + 1,
                    num_nodes
                );
                let idx = lookup.get(&name).unwrap();
                nodes.get_mut(*idx).unwrap().completed = comps;
            }
            debug!("setting prev_level");
            prev_level = Arc::new(Some(nodes.clone()));
        }

        CompletionLevels {
            levels: self.levels,
            params: self.params,
            state: std::marker::PhantomData,
        }
    }
}

impl CompletionLevels<CompletedState> {
    pub fn disassemble(mut self) -> Vec<String> {
        self.levels[0].nodes.remove(0).completed
    }
}
