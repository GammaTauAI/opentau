















const countUnivalSubtrees = function(root) {
  let res = { num: 0 }
  chk(root, null, res)
  return res.num
}

function chk(node, pVal, obj) {
  if (node == null) return true
  const left = chk(node.left, node.val, obj)
  const right = chk(node.right, node.val, obj)
  if (left && right) {
    if (node.left !== null && node.val !== node.left.val) {
      return false;
    }
    if (node.right !== null && node.val !== node.right.val) {
      return false;
    }
    obj.num++
    return true
  }
  return false
}


