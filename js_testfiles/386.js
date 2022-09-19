
















const inorderSuccessor = function(node) {
  if (node.right == null) {
    let cur = node
    while (cur.parent !== null && cur.parent.right === cur) {
      cur = cur.parent
    }
    return cur.parent
  }
  let cur = node.right
  while (cur.left !== null) {
    cur = cur.left
  }
  return cur
}

