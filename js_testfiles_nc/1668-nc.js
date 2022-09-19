const findClosestLeaf = function(root, k) {
  if (root == null) return -1
  const g = new Map()
  dfs(root, null, g)
  const q = []
  for (let [key, value] of g) {
    if (key.val === k) {
      q.push(key, ...g.get(key))
      break
    }
  }
  const s = new Set()
  while (q.length) {
    const size = q.length
    for (let i = 0; i < size; i++) {
      const node = q.shift()
      if (node.left === null && node.right === null) return node.val
      if (!s.has(node)) q.push(...g.get(node))
      s.add(node)
    }
  }
}
function dfs(node, parent, g) {
  if (node == null) return
  if (g.get(node) == null) g.set(node, new Set())
  if (parent) {
    g.get(node).add(parent)
    if (g.get(parent) == null) g.set(parent, new Set())
    g.get(parent).add(node)
  }
  dfs(node.left, node, g)
  dfs(node.right, node, g)
}
