const convertBST = function(root) {
  const arr = []
  traverse(root, arr)
  for(let i = arr.length - 2; i >= 0; i--) {
    arr[i].val += arr[i + 1].val
  }
  return root
};
function traverse(node, arr) {
  if(node == null) return
  traverse(node.right, arr)
  arr.unshift(node)
  traverse(node.left, arr)
}
const convertBST = function(root) {
  const obj = {sum: 0}
  traverse(root, obj)
  return root
};
function traverse(node, obj) {
  if(node == null) return
  traverse(node.right, obj)
  node.val += obj.sum
  obj.sum = node.val
  traverse(node.left, obj)
}
