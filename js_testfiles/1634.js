
















const lowestCommonAncestor = function (root, p, q) {
  let cn = null
  const dfs = function (node) {
    let mid = 0
    if (!node) return false
    let left = dfs(node.left)
    let right = dfs(node.right)
    if (node === p || node === q) {
      mid = 1
    } else {
      mid = 0
    }
    if (mid + left + right >= 2) {
      cn = node
    } else {
      if (mid) return mid
      return left || right
    }
  }
  dfs(root)
  return cn
}

