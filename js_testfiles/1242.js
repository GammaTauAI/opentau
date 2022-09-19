














const postorder = function(root) {
    const res = []
    traverse(root, res)
    return res
};

function traverse(node, res) {
  if(node == null) return
  for(let i = 0; i < node.children.length; i++) {
    traverse(node.children[i], res)
  }
  res.push(node.val)
}

