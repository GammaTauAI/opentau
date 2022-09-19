
















const lowestCommonAncestor = function(root, p, q) {
    while((root.val - p.val) * (root.val - q.val) > 0) {
          root = root.val > p.val ? root.left : root.right
    }
    return root
};

