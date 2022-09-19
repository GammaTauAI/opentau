















var reverseOddLevels = function(root) {
  
  let q = [root]
  let level = 0
  
  while(q.length) {
    const nxt = []
    for(let i = 0; i < q.length; i++) {
      const cur = q[i]
      if(cur.left) nxt.push(cur.left)
      if(cur.right) nxt.push(cur.right)
    }
    if(level % 2 === 1) {
      const arr = q.map(e => e.val)
      arr.reverse()
      for(let i = 0; i < q.length; i++) {
        q[i].val = arr[i]
      }
    }
    
    level++
    q = nxt
  }
  
  // dfs(root, 0)
  return root

};

