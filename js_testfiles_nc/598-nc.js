function pathSum(root, sum) {
    const preSums = new Map([[0, 1]]);
    let count = 0;
    visit(root, 0);
    return count;
    function visit(node, preSum) {
        if (!node) return;
        preSum += node.val;
        count += preSums.get(preSum - sum) || 0;
        preSums.set(preSum, (preSums.get(preSum) || 0) + 1);
        visit(node.left, preSum);
        visit(node.right, preSum);
        preSums.set(preSum, preSums.get(preSum) - 1);
    }
}
