















var averageOfSubtree = function(root) {
  let res = 0
  dfs(root)
  return res
  
  function dfs(node) {
    if(node == null) return [0, 0]
    let [lSum, lNum] = dfs(node.left)
    let [rSum, rNum] = dfs(node.right)
    if(node.val === Math.floor((node.val + lSum + rSum) / (lNum + rNum + 1))) {
      res++
    }
    return [node.val + lSum + rSum, lNum + rNum + 1]
  }
};

