















const flatten = function(root) {
  let prev = null
  function op(root) {
    if (root == null) return;
    op(root.right);
    op(root.left);
    root.right = prev;
    root.left = null;
    prev = root;
  }
  op(root)
};



