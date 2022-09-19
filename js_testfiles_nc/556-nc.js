const goodNodes = function(root) {
  if(root == null) return 0
  let res = 0
  helper(root, root.val)
  return res
  function helper(node, max) {
    if(node == null) return
    if(node.val >= max) {
      res++
      max = node.val
    }
    helper(node.left, max)
    helper(node.right, max)
  }
};
