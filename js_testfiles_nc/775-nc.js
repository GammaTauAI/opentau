const splitBST = function(root, V) {
  if(root == null) return [null, null]
  if(root.val > V) {
    const [left, right] = splitBST(root.left, V)
    root.left = right
    return [left, root]
  } else {
    const [left, right] =  splitBST(root.right, V)
    root.right = left
    return [root, right]
  }
};
