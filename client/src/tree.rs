use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CodeBlockTree {
    pub name: String,
    pub code: String,
    pub children: Vec<CodeBlockTree>,
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

pub type NaiveCompletionLevels = Vec<Vec<(Vec<usize>, String, String)>>;

impl From<CodeBlockTree> for NaiveCompletionLevels {
    fn from(tree: CodeBlockTree) -> Self {
        let mut levels = vec![];
        let mut nodes = vec![(vec![], tree.name, tree.code)];
        let mut children = vec![(0, tree.children)];
        while !nodes.is_empty() {
            levels.push(nodes);
            nodes = vec![];
            let mut new_children = vec![];
            for (p_idx, children) in children {
                for child in children {
                    let idx = nodes.len();

                    let level = levels.len() - 1;
                    levels
                        .get_mut(level)
                        .unwrap()
                        .get_mut(p_idx)
                        .unwrap()
                        .0
                        .push(idx);

                    nodes.push((vec![], child.name, child.code));
                    new_children.push((idx, child.children));
                }
            }
            children = new_children;
        }
        levels
    }
}
