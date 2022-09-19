const maximumAverageSubtree = function(root) {
  let max = -Number.MIN_VALUE;
  function helper(root) {
    if (!root) return [0, 0];     const [lTotal, lNum] = helper(root.left);
    const [rTotal, rNum] = helper(root.right);
    max = Math.max(max, (rTotal + lTotal + root.val) / (rNum + lNum + 1));
    return [lTotal + rTotal + root.val, lNum + rNum + 1];
  }
  helper(root);
  return max;
};
