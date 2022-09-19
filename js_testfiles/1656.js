















const sumEvenGrandparent = function(root) {
  let res = 0
  dfs(root, null, null)
  return res
  
  
  function dfs(node, parent, gp) {
    if(node == null) return
    if(parent && gp && gp.val % 2 === 0) {
      res += node.val
    }
    dfs(node.left, node, parent)
    dfs(node.right, node, parent)
  }
  
};

