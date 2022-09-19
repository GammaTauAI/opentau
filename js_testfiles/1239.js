














const postorderTraversal = function(root) {
    const res = []
    traverse(root, res)
    return res
};

function traverse(node, arr) {
  if(node == null) return
  traverse(node.left, arr)
  traverse(node.right, arr)
  arr.push(node.val)
}

