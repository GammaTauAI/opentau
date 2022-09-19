















const findRoot = function(tree) {
  let sum = 0
  for(let n of tree) {
    sum += n.val
    for(let c of n.children) {
      sum -= c.val
    }
  }
  for(let n of tree) {
    if(n.val === sum) return n
  }
  return null
};

// another













const findRoot = function(tree) {
  let sum = 0
  for(let n of tree) {
    sum ^= n.val
    for(let c of n.children) {
      sum ^= c.val
    }
  }
  for(let n of tree) {
    if(n.val === sum) return n
  }
  return null
};

