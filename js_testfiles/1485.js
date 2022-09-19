
















const findNearestRightNode = function(root, u) {
  const q = [root]
  while(q.length) {
    const size = q.length
    let target = false
    for(let i = 0; i < size; i++) {
      const tmp = q.shift()
      if(target) return tmp
      if(tmp === u) target = true
      if(tmp.left) q.push(tmp.left)
      if(tmp.right) q.push(tmp.right)
    }
  }     
  return null
};

