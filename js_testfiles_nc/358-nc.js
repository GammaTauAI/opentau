const flipBinaryTree = function(root, leaf) {
  function flip(node, from_node){
        const p = node.parent
    node.parent = from_node
    if (node.left === from_node) node.left = null
    if (node.right === from_node) node.right = null
        if (node === root) return node
        if (node.left) node.right = node.left
        node.left = flip(p, node)
    return node
  }
  return flip(leaf, null)
};
