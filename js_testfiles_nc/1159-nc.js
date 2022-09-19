const findDuplicateSubtrees = function(root) {
  const hash = {}, res = []
  pre(root, hash, res)
  return res
};
function pre(node, hash, res) {
  if(node == null) return '#'
  const str = `${node.val},${pre(node.left, hash, res)},${pre(node.right, hash, res)}`
  if(hash[str] == null) hash[str] = 0
  hash[str]++
  if(hash[str] === 2) res.push(node)
  return str
}
const findDuplicateSubtrees = function(root) {
  const serId = {}, cntId = {}, res = []
  let id = 1
  post(root)
  return res
  function post(node) {
    if(node == null) return 0
    const curId = `${post(node.left)},${node.val},${post(node.right)}`
    serId[curId] = serId[curId] || id
    if(serId[curId] === id) id++
    cntId[curId] = (cntId[curId] || 0) + 1
    if(cntId[curId] === 2) res.push(node)
    return serId[curId]
  }
};
