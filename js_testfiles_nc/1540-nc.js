const findLeaves = function(root) {
  const res = []
  if(root == null) return res
  while(root.left || root.right) {
    const tmp = []
    leaves(root, null, tmp)
    res.push(tmp)
  }
  res.push([root.val])
  return res
};
function leaves(node, p, res) {
  if(node == null) return
  if(node.left === null && node.right === null) {
    res.push(node.val)
    if(p && p.left === node) p.left = null
    if(p && p.right === node) p.right = null
    return
  }
  leaves(node.left, node, res)
  leaves(node.right, node, res)
}
const findLeaves = function(root) {
  const res = []
  dfs(root, res)
  return res
};
function dfs(node, res) {
  if(node == null) return -1
  const i = 1 + Math.max(dfs(node.left, res), dfs(node.right, res))
  if(!res[i]) res[i] = []
  res[i].push(node.val)
  return i
}
