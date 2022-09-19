















const increasingBST = function(root) {
  return helper(root, null)
};

function helper(node, tail) {
  if(node == null) return tail
  const res = helper(node.left, node)
  node.left = null
  node.right = helper(node.right, tail)
  return res
}

