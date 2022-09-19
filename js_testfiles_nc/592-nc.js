const trimBST = function(root, L, R) {
  return single(root, L, R);
};
function single(node, L, R) {
  if (node === null) {
    return null;
  }
  if (node.val > R) {
    return single(node.left, L, R);
  }
  if (node.val < L) {
    return single(node.right, L, R);
  }
  if (node.left !== null) {
    node.left = single(node.left, L, R);
  }
  if (node.right !== null) {
    node.right = single(node.right, L, R);
  }
  return node;
}
