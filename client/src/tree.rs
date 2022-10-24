use std::{collections::HashMap, sync::Arc};

use serde::{Deserialize, Serialize};
use tokio::task::JoinHandle;

use crate::codex::{CodexClient, Completion, CompletionQuery};

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CodeBlockTree {
    pub name: String,
    pub code: String,
    pub children: Vec<CodeBlockTree>,
}

#[async_trait::async_trait]
pub trait TreeCompletion {
    /// Completes the code block tree, mutating the tree in place.
    async fn tree_complete(&mut self, codex: CodexClient);
}

// NOTE: tree compeltion algo (naive and inefficient way, with only one single completion per code-block):
// - Step 1: make the code block tree out of the original input code.
// - Step 2: make a nested array of code blocks, where the outer array index is the
//   level of the blocks at the array of that index. every element of the inner arrays is a tuple
//   of (children_idxs: Vec<usize>, name: String, code: String).
// - Step 3: we start at the deepest level of the array, and we complete the code blocks
//   at the level.
// - Step 4: we then go to a level above, and for each node, substitute the stub of the code block
//   blocks bellow of the children. we then complete the code blocks at the level.
// - Step 5: we repeat step 4 until we reach the root level. we have a completed code block tree.
// - Step 6: we disassemble the code block tree and substitute the completed types into the original
//   code. we type check the code, and if it passes, we return the code. if it fails, we go to step 3.
//
// Why the nested array instead of just using DFS? This representation allows to complete concurrently

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NaiveNode {
    pub children_idxs: Vec<usize>,
    pub name: String,
    pub code: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NaiveLevel {
    pub nodes: Vec<NaiveNode>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NaiveCompletionLevels {
    pub levels: Vec<NaiveLevel>,
}

impl From<CodeBlockTree> for NaiveCompletionLevels {
    fn from(tree: CodeBlockTree) -> Self {
        // dyanmic programming solution. took me a while to figure out how to do this.

        // here we have the levels of the tree
        let mut levels = vec![];
        // this is a memoization table, where we store the nodes of the tree at each level,
        // with the children idx that need to be patched in the level after
        let mut nodes = vec![NaiveNode {
            children_idxs: vec![],
            name: tree.name,
            code: tree.code,
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
                    let children_idxs = &mut levels
                        .get_mut(level)
                        .unwrap()
                        .nodes
                        .get_mut(p_idx)
                        .unwrap()
                        .children_idxs;
                    children_idxs.push(idx);

                    // push unpatched node
                    nodes.push(NaiveNode {
                        children_idxs: vec![],
                        name: child.name,
                        code: child.code,
                    });
                    // push children
                    new_children.push((idx, child.children));
                }
            }
            // reassign children
            p_children = new_children;
        }
        NaiveCompletionLevels { levels }
    }
}

#[async_trait::async_trait]
impl TreeCompletion for NaiveCompletionLevels {
    /// Completes the code block tree, mutating the tree in place.
    async fn tree_complete(&mut self, codex: CodexClient) {
        async fn retry_query_until_ok(codex: &CodexClient, q: CompletionQuery) -> Completion {
            let mut res = codex.complete(q.clone()).await;
            while res.is_err() {
                res = codex.complete(q.clone()).await;
            }
            res.unwrap().remove(0)
        }

        // we start at the deepest level of the array, and we complete the code blocks
        // at the level.

        let num_levels = self.levels.len();
        let mut prev_level: Arc<Option<Vec<NaiveNode>>> = Arc::new(None);
        for level in (0..num_levels).rev() {
            println!("level: {}", level);
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
                            code = codex
                                .get_ls()
                                // we take the min because at level 0 we have the root node
                                // and we want to weave at nettle_level 0
                                .weave(&code, &child.code, std::cmp::min(1, level))
                                .await
                                .unwrap();
                        }
                    }
                    // if we are at root, we just want to disassemble the tree, no comps
                    if level != 0 {
                        let printed = codex.get_ls().pretty_print(&code, "_hole_").await.unwrap();
                        let q = CompletionQuery::new(printed, 1, 1, false);
                        let comp = retry_query_until_ok(&codex, q).await;
                        println!("level comp: \n{}", comp.code);
                        (node.name, comp.code)
                    } else {
                        (node.name, code)
                    }
                }));
            }
            for handle in handles {
                let (name, code) = handle.await.unwrap();
                let idx = lookup.get(&name).unwrap();
                nodes.get_mut(*idx).unwrap().code = code;
            }
            println!("setting prev_level");
            prev_level = Arc::new(Some(nodes.clone()));
        }
    }
}
