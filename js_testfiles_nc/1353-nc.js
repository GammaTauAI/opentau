const canMerge = function (trees) {
  const mapRoots = {}
  const mapLeaves = {}
  let prev
    for (let node of trees) {
    mapRoots[node.val] = node
    if (node.left != null) {
      if (mapLeaves[node.left.val] != null)
                return null
      mapLeaves[node.left.val] = node.left
    }
    if (node.right != null) {
      if (mapLeaves[node.right.val] != null)
                return null
      mapLeaves[node.right.val] = node.right
    }
  }
  let rootRes = null
  let count = trees.length
      for (let node of trees) {
    if (mapLeaves[node.val] == null) {
      rootRes = node
      break
    }
  }
    if (rootRes == null) return rootRes
  const q = []
    if (rootRes.left != null) q.push(rootRes.left)
  if (rootRes.right != null) q.push(rootRes.right)
  count--
  while (q.length) {
        let leaf = q.pop()
    let root = mapRoots[leaf.val]
    if (root != null) {
            count--
      leaf.left = root.left
      leaf.right = root.right
            if (root.left != null) q.push(root.left)
      if (root.right != null) q.push(root.right)
    }
  }
  prev = 0
    return count == 0 && recSanity(rootRes) ? rootRes : null
  function recSanity(node) {
    if (node == null) return true
    if (!recSanity(node.left)) return false
    if (prev >= node.val) return false
    prev = node.val
    return recSanity(node.right)
  }
}
