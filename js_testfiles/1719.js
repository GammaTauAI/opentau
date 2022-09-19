















const lowestCommonAncestor = function(root, nodes) {
  if (root == null) return root
  for(let e of nodes) {
    if(root === e) return root
  }
  const left = lowestCommonAncestor(root.left, nodes)
  const right = lowestCommonAncestor(root.right, nodes)
  if(left && right) return root
  return left ? left : right
};

