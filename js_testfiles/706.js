














const maxDepth = function(root) {
  if (!root) return 0;
  const left = maxDepth(root.left);
  const right = maxDepth(root.right);
  let depth = left > right ? left : right;
  return (depth += 1);
};

