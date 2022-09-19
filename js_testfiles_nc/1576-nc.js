const preorder = function(root) {
  const arr = []
  traverse(root, arr)
  return arr
};
function traverse(node, arr) {
  if(node === null) return
  arr.push(node.val)
  for(let i = 0; i < node.children.length; i++) {
    traverse(node.children[i], arr)
  }
}
