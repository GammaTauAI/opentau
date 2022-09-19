



















const closestKValues = function(root, target, k) {
  const res = []
  let node = root
  const stack = []
  while (node || stack.length) {
    if (node) {
      stack.push(node)
      node = node.left
    } else {
      node = stack.pop()
      if (res.length === k) {
        if (Math.abs(res[0] - target) <= Math.abs(node.val - target)) {
          return res
        }
        res.shift()
      }
      res.push(node.val)
      node = node.right
    }
  }
  return res
}

