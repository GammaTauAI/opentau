
















const searchBST = function (root, val) {
  if (!root || root.val === val) {
    return root
  }
  return root.val < val ? searchBST(root.right, val) : searchBST(root.left, val)
}

