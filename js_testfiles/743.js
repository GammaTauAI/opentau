

















const constructFromPrePost = function(pre, post) {
  let i = 0,
    j = 0
  return (function dfs() {
    let val = pre[i++]
    let node = new TreeNode(val)
    if (val !== post[j]) node.left = dfs()
    if (val !== post[j]) node.right = dfs()
    j++
    return node
  })()
}

