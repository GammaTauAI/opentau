














const FindElements = function(root) {
  this.root = root
  this.set = new Set()
  if(root) this.set.add(0)
  
  dfs(root, 0, this.set)

  // console.log(this.set)
  function dfs(node, cur, set) {
    if(node == null) return
    
    if(node.left) {
      const child = cur * 2 + 1
      set.add(child)
      dfs(node.left, child, set)
    }
    if(node.right) {      
      const child = cur * 2 + 2
      set.add(child)
      dfs(node.right, child, set)
    }
  }
};





FindElements.prototype.find = function(target) {
    return this.set.has(target)
};








