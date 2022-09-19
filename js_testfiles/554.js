
















const largestBSTSubtree = function(root) {
  const res = helper(root)
  return res[2]
}

function helper(node) {
  if (!node) return [Number.MAX_VALUE, -Number.MAX_VALUE, 0]
  const left = helper(node.left)
  const right = helper(node.right)
  if (node.val > left[1] && node.val < right[0]) {
    return [
      Math.min(node.val, left[0]),
      Math.max(node.val, right[1]),
      left[2] + right[2] + 1
    ]
  } else {
    return [-Number.MAX_VALUE, Number.MAX_VALUE, Math.max(left[2], right[2])]
  }
}

// another

const largestBSTSubtree = function(root) {
  function dfs(node) {
    if (!node) return [0, 0, Number.MAX_VALUE, -Number.MAX_VALUE]
    const [N1, n1, min1, max1] = dfs(node.left)
    const [N2, n2, min2, max2] = dfs(node.right)
    const n =
      max1 < node.val && min2 > node.val ? n1 + 1 + n2 : -Number.MAX_VALUE
    return [
      Math.max(N1, N2, n),
      n,
      Math.min(min1, node.val),
      Math.max(max2, node.val)
    ]
  }
  return dfs(root)[0]
}

