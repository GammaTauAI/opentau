
















const kthSmallest = function (root, k) {
  const st = []
  while (root !== null) {
    st.push(root)
    root = root.left
  }
  while (k !== 0) {
    const n = st.pop()
    k--
    if (k === 0) return n.val
    let right = n.right
    while (right !== null) {
      st.push(right)
      right = right.left
    }
  }
  return -1
}

