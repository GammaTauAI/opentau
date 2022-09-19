const verticalOrder = function(root) {
  const res = []
  if(root == null) return res
  const map = new Map()
  const q = []
  const cols = []
  q.push(root)
  cols.push(0)
  let min = 0
  let max = 0
  while(q.length) {
    const node = q.shift()
    const col = cols.shift()
    if(!map.has(col)) {
      map.set(col, [])
    }
    map.get(col).push(node.val)
    if(node.left !== null) {
      q.push(node.left)
      cols.push(col - 1)
      min = Math.min(min, col - 1)
    }
    if(node.right !== null) {
      q.push(node.right)
      cols.push(col + 1)
      max = Math.max(max, col + 1)
    }
  }
  for(let i = min; i <= max; i++) {
    res.push(map.get(i))
  }
  return res
};
const verticalOrder = function(root) {
  if (!root) return []
  let result = []
  function recurse(root, col, row) {
    if (!root) return
    recurse(root.left, col - 1, row + 1)
    recurse(root.right, col + 1, row + 1)
    result[col] = result[col] || []
    result[col][row] = result[col][row] || []
    result[col][row].push(root.val)
  }
  recurse(root, 100, 0)
  return result
    .filter(x => x)
    .map(row => row.reduce((acc, val) => acc.concat(val), []))
}
