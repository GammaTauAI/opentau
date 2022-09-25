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
//   of (children_idxs: Vec<usize>, name: String, code: String),
//   the root block has a parent idx of -1, to symbolize not having a parent.
// - Step 3: we start at the deepest level of the array, and we complete the code blocks
//   at the level.
// - Step 4: we then go to a level above, and for each node, substitute the stub of the code block
//   blocks bellow of the children. we then complete the code blocks at the level.
// - Step 5: we repeat step 4 until we reach the root level. we have a completed code block tree.
// - Step 6: we disassemble the code block tree and substitute the completed types into the original
//   code. we type check the code, and if it passes, we return the code. if it fails, we go to step 3.
