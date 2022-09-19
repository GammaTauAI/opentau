
















const checkEquivalence = function(root1, root2) {
  const q = {}
  const helper = (node) => {
    if (node == null) return
    if(node.val !== '+') {
      if(q[node.val] == null) q[node.val] = 0
      q[node.val]++      
    }
    helper(node.left)
    helper(node.right)
  }
  helper(root1)
  const h = node => {
    if(node == null) return
    if(node.val !== '+') {
      if(q[node.val] == null) return false
      q[node.val]--
      if(q[node.val] <= 0) delete q[node.val]
    }
    h(node.left)
    h(node.right)
  }
  h(root2)
  if(Object.keys(q).length > 0) return false
  return true
};

