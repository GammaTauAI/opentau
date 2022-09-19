const inorderTraversal = function(root) {
  const res = [];
  if (root == null) return res;
  traversal(root, res);
  return res;
};
function traversal(node, res) {
  if (node.left) {
    traversal(node.left, res);
  }
  res.push(node.val);
  if (node.right) {
    traversal(node.right, res);
  }
}
