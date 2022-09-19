const isSameTree = function(p, q) {
  if(p == null && q == null) return true
  if(p == null || q == null || p.val !== q.val) return false
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right)
};
const isSameTree = function(p, q) {
  if(p == null || q == null) return p === q
  if(p.val !== q.val) return false
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right)
};
