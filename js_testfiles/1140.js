















const distributeCoins = function(root) {
  let res = 0
  helper(root)
  return res
  
  function helper(node) {
    if(node == null) return 0
    const left = helper(node.left)
    const right = helper(node.right)
    res += Math.abs(left) + Math.abs(right)
    return node.val + left + right - 1
  }
};

