















const deepestLeavesSum = function(root) {
  let res= 0
  let q = [root]
  while(q.length) {
    const size = q.length
    const tmp = []
    res = 0
    for(let i = 0; i < size; i++) {
      res += q[i].val
      if(q[i].left) tmp.push(q[i].left)
      if(q[i].right) tmp.push(q[i].right)
    }
    
    q = tmp
  }
  return res
};

