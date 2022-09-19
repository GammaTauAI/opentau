















const invertTree = function (root) {
  if (root) {
    ;[root.left, root.right] = [invertTree(root.right), invertTree(root.left)]
  }
  return root
}

// another













const invertTree = function (root) {
  if (!root) return root
  let queue = [root]
  while (queue.length) {
    let node = queue.shift()
    if (node.left) {
      queue.push(node.left)
    }
    if (node.right) {
      queue.push(node.right)
    }
    let left = node.left
    node.left = node.right
    node.right = left
  }
  return root
}

// anoother













const invertTree = function(root) {
  if(root == null) return root
  let tmp = root.left
  root.left = invertTree(root.right)
  root.right = invertTree(tmp)
  return root
};

