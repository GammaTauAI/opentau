const connect = function(root) {
  if (root == null) return null
  const cur = [root]
  while (cur.length) {
    const len = cur.length
    for (let i = 0; i < len; i++) {
      const el = cur.shift()
      if (i === len - 1) el.next = null
      else el.next = cur[0]
      if (el.left) cur.push(el.left)
      if (el.right) cur.push(el.right)
    }
  }
  return root
}
