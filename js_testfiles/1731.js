
















const longestConsecutive = function(root) {
  const res = { max: 0 }
  dfs(root, null, 0, res)
  return res.max
};

function dfs(node, p, cur, res) {
  if(node === null) {
    return
  }
  let s = 0
  if(p === null) s = 1
  else if(node.val - p.val === 1) s = cur + 1
  else s = 1
  if(s > res.max) res.max = s
  dfs(node.left, node, s, res)
  dfs(node.right, node, s, res)
}

