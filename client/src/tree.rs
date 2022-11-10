use std::{
    cmp::Ordering,
    collections::{HashMap, HashSet},
    sync::Arc,
};

use serde::{Deserialize, Serialize};
use tokio::task::JoinHandle;

use crate::{
    codex::{CodexClient, Completion, CompletionQuery},
    debug,
    langserver::{ArcLangServer, LangServerError},
};

/// A codeblock tree, taken from the `tree` command of the language server
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CodeBlockTree {
    pub name: String, // NOTE: this is a generated name, not the original name
    pub code: String,
    pub children: Vec<CodeBlockTree>,
}

#[async_trait::async_trait]
pub trait TreeCompletion {
    /// Returns a tree completion for the given codeblock tree
    async fn prepare(
        tree: CodeBlockTree,
        langsever: ArcLangServer,
    ) -> Result<Self, LangServerError>
    where
        Self: Sized;

    /// Completes the code block tree, mutating the tree in place.
    async fn tree_complete(&mut self, codex: CodexClient);
}

/// tree compeltion algo (naive and inefficient way, with only one single completion per code-block):
/// - Step 1: make the code block tree out of the original input code.
/// - Step 2: make a nested array of code blocks, where the outer array index is the
///   level of the blocks at the array of that index. every element of the inner arrays is a tuple
///   of (children_idxs: Vec<usize>, name: String, code: String, usages: String).
/// - Step 3: we start at the deepest level of the array, and we complete the code blocks
///   at the level.
/// - Step 4: we then go to a level above, and for each node, substitute the stub of the code block
///   blocks bellow of the children. we then complete the code blocks at the level.
/// - Step 5: we repeat step 4 until we reach the root level. we have a completed code block tree.
/// - Step 6: we disassemble the code block tree and substitute the completed types into the original
///   code. we type check the code, and if it passes, we return the code. if it fails, we go to step 3.
///
/// Why the nested array instead of just using DFS? This representation allows to complete concurrently
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NaiveNode {
    pub children_idxs: Vec<usize>,
    pub name: String,
    pub code: String,
    pub usages: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NaiveLevel {
    pub nodes: Vec<NaiveNode>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NaiveCompletionLevels {
    pub levels: Vec<NaiveLevel>,
}

#[async_trait::async_trait]
impl TreeCompletion for NaiveCompletionLevels {
    /// Returns a tree completion for the given codeblock tree
    async fn prepare(
        tree: CodeBlockTree,
        langsever: ArcLangServer,
    ) -> Result<Self, LangServerError> {
        // dyanmic programming solution. took me a while to figure out how to do this.

        // here we have the levels of the tree
        let mut levels = vec![];
        // this is a memoization table, where we store the nodes of the tree at each level,
        // with the children idx that need to be patched in the level after
        let mut nodes = vec![NaiveNode {
            children_idxs: vec![],
            name: tree.name,
            code: tree.code,
            usages: String::new(), // no usages for root..
        }];
        // here we store the children of the nodes, and the idx of the node that they belong to
        let mut p_children = vec![(0, tree.children)];

        while !nodes.is_empty() {
            // we push the level of nodes that we got the iteration before
            levels.push(NaiveLevel { nodes });
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
                    let usages = langsever.usages(&parent.code, &child.code).await?;

                    // push unpatched node
                    nodes.push(NaiveNode {
                        children_idxs: vec![],
                        name: child.name,
                        code: child.code,
                        usages,
                    });
                    // push children
                    new_children.push((idx, child.children));
                }
            }
            // reassign children
            p_children = new_children;
        }
        Ok(NaiveCompletionLevels { levels })
    }

    /// Completes the code block tree, mutating the tree in place.
    async fn tree_complete(&mut self, codex: CodexClient) {
        async fn retry_query_until_ok(codex: &CodexClient, q: CompletionQuery) -> Completion {
            let mut res = codex.complete(q.clone()).await;
            let mut retries = 0;
            while res.is_err() {
                retries += 1;
                let mut q = q.clone();
                q.num_comps = 1 + retries;
                res = codex.complete(q).await;
            }
            res.unwrap().remove(0)
        }

        // we start at the deepest level of the array, and we complete the code blocks
        // at the level.

        let num_levels = self.levels.len();
        let mut prev_level: Arc<Option<Vec<NaiveNode>>> = Arc::new(None);
        for level in (0..num_levels).rev() {
            debug!("level: {}", level);
            let nodes = &mut self.levels.get_mut(level).unwrap().nodes;
            let mut handles: Vec<JoinHandle<(String, String)>> = vec![]; // node's (name, code)
            let mut lookup: HashMap<String, usize> = HashMap::new(); // node's name -> idx
            for (i, node) in nodes.iter().enumerate() {
                let node = node.clone();
                let prev_level = prev_level.clone();
                let codex = codex.clone();
                lookup.insert(node.name.clone(), i);
                // we concurrently complete the code blocks at the level.
                handles.push(tokio::task::spawn(async move {
                    let mut code: String = node.code.to_string();
                    // if we are not at a leaf, we need to patch the node with the children
                    if !node.children_idxs.is_empty() {
                        let level_below: &Vec<NaiveNode> = prev_level.as_ref().as_ref().unwrap();
                        for child_idx in node.children_idxs.iter() {
                            let child = level_below.get(*child_idx).unwrap_or_else(|| {
                                panic!(
                                    "child_idx {} should be in level_below, which has len {}",
                                    child_idx,
                                    level_below.len()
                                )
                            });
                            debug!("before weave:\n{}", code);
                            code = codex
                                .get_ls()
                                // we take the min because at level 0 we have the root node
                                // and we want to weave at nettle_level 0
                                .weave(&code, &child.code, std::cmp::min(1, level))
                                .await
                                .unwrap();
                            debug!("weaved {} into:\n{}", child.name, code);
                        }
                    }
                    match level.cmp(&0) {
                        Ordering::Greater => {
                            let ls = codex.get_ls();
                            let stubbed = ls.stub(&code).await.unwrap();
                            let mut printed = ls.pretty_print(&stubbed, "_hole_").await.unwrap();

                            // we add usages to the prompt
                            if !node.usages.is_empty() {
                                printed = format!("{}\n{}", printed, node.usages);
                            }

                            let q = CompletionQuery::new(printed, 1, 1, false);
                            debug!("query: {}", q.input);
                            let comp = retry_query_until_ok(&codex, q).await;
                            debug!("level comp: \n{}", comp.code);
                            let rewoven = ls.weave(&code, &comp.code, 0).await.unwrap();
                            (node.name, rewoven)
                        }
                        // if we are at root, we just want to disassemble the tree, no comps
                        Ordering::Equal => (node.name, code),
                        Ordering::Less => unreachable!(),
                    }
                }));
            }
            for handle in handles {
                let (name, code) = handle.await.unwrap();
                let idx = lookup.get(&name).unwrap();
                nodes.get_mut(*idx).unwrap().code = code;
            }
            debug!("setting prev_level");
            prev_level = Arc::new(Some(nodes.clone()));
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

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CompletionLevels {
    pub levels: Vec<CompLevel>,
    // we propagate these query params to the completion queries
    pub retries: usize,
    pub num_comps: usize,
    pub fallback: bool,
}

#[async_trait::async_trait]
impl TreeCompletion for CompletionLevels {
    /// Returns a tree completion for the given codeblock tree
    async fn prepare(
        tree: CodeBlockTree,
        langsever: ArcLangServer,
    ) -> Result<Self, LangServerError> {
        // dyanmic programming solution. took me a while to figure out how to do this.

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
                    let usages = langsever.usages(&parent.code, &child.code).await?;

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
            retries: 1,
            num_comps: 1,
            fallback: false,
        })
    }

    /// Completes the code block tree, mutating the tree in place.
    async fn tree_complete(&mut self, codex: CodexClient) {
        async fn retry_query_until_ok(codex: &CodexClient, q: CompletionQuery) -> Vec<Completion> {
            let mut res = codex.complete(q.clone()).await;
            let mut retries = 0;
            while res.is_err() {
                if retries > 5 {
                    eprintln!("Failed to complete query: {}", q.input);
                    std::process::exit(1);
                }
                retries += 1;
                let q = q.clone();
                res = codex.complete(q).await;
            }
            res.unwrap()
        }

        // we start at the deepest level of the array, and we complete the code blocks
        // at the level.
        let num_levels = self.levels.len();
        let mut prev_level: Arc<Option<Vec<CompNode>>> = Arc::new(None);
        for level in (0..num_levels).rev() {
            debug!("level: {}", level);
            let nodes = &mut self.levels.get_mut(level).unwrap().nodes;
            let mut handles: Vec<JoinHandle<(String, Vec<String>)>> = vec![]; // node's (name, code)
            let mut lookup: HashMap<String, usize> = HashMap::new(); // node's name -> idx
            for (i, node) in nodes.iter().enumerate() {
                let node = node.clone();
                let prev_level = prev_level.clone();
                let num_comps = self.num_comps;
                let retries = self.retries;
                let fallback = self.fallback;
                let codex = codex.clone();
                lookup.insert(node.name.clone(), i);
                // we concurrently complete the code blocks at the level.
                handles.push(tokio::task::spawn(async move {
                    let mut prompts: Vec<String> = vec![node.code.clone()];
                    // if we are not at a leaf, we need to patch the node with the children
                    if !node.children_idxs.is_empty() {
                        let level_below: &Vec<CompNode> = prev_level.as_ref().as_ref().unwrap();
                        for child_idx in node.children_idxs.iter() {
                            let child = level_below.get(*child_idx).unwrap_or_else(|| {
                                panic!(
                                    "child_idx {} should be in level_below, which has len {}",
                                    child_idx,
                                    level_below.len()
                                )
                            });
                            // make all possible permutations between prompt elements and
                            // child.completed elements
                            let mut new_prompts = vec![];
                            for parent_code in prompts.iter() {
                                for child_code in child.completed.iter() {
                                    let comp = codex
                                        .get_ls()
                                        // we take the min because at level 0 we have the root node
                                        // and we want to weave at nettle_level 0
                                        .weave(parent_code, child_code, std::cmp::min(1, level))
                                        .await
                                        .unwrap();
                                    new_prompts.push(comp);
                                }
                            }

                            prompts = new_prompts;
                        }
                    }
                    debug!("number of level prompts: {}", prompts.len());
                    // remove duplicates from prompts
                    let prompts_set = prompts.iter().cloned().collect::<HashSet<_>>();
                    prompts = prompts_set.into_iter().collect();
                    match level.cmp(&0) {
                        Ordering::Greater => {
                            let ls = codex.get_ls();
                            let mut new_comps = HashSet::new(); // we don't care about duplicates
                            for prompt in prompts.iter() {
                                let stubbed = ls.stub(prompt).await.unwrap();
                                let mut printed =
                                    ls.pretty_print(&stubbed, "_hole_").await.unwrap();

                                // we add usages to the prompt
                                if !node.usages.is_empty() {
                                    printed = format!("{}\n{}", printed, node.usages);
                                }

                                let q = CompletionQuery::new(printed, num_comps, retries, fallback);

                                debug!("query: {}", q.input);
                                let comps = retry_query_until_ok(&codex, q).await;
                                for comp in comps {
                                    debug!("level comp: \n{}", comp.code);
                                    let rewoven = ls.weave(prompt, &comp.code, 0).await.unwrap();
                                    println!("type-woven completion: \n{}", rewoven);
                                    new_comps.insert(rewoven);
                                }
                            }
                            (node.name, new_comps.into_iter().collect())
                        }
                        // if we are at root, we just want to disassemble the tree, no comps
                        Ordering::Equal => (node.name, prompts),
                        Ordering::Less => unreachable!(),
                    }
                }));
            }
            for handle in handles {
                let (name, comps) = handle.await.unwrap();
                let idx = lookup.get(&name).unwrap();
                nodes.get_mut(*idx).unwrap().completed = comps;
            }
            debug!("setting prev_level");
            prev_level = Arc::new(Some(nodes.clone()));
        }
    }
}
