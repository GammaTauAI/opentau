const delNodes = function(root, to_delete) {
  let rst = []
  let dfs = function(node, isRoot) {
    if (!node) return
    let isDel = to_delete.indexOf(node.val) !== -1
    if (node.left) node.left = dfs(node.left, isDel)
    if (node.right) node.right = dfs(node.right, isDel)
    if (isRoot && !isDel) rst.push(node)
    return isDel ? null : node
  }
  if (!root) return []
  dfs(root, true)
  return rst
}
