















const flipEquiv = function(root1, root2) {
  if(root1 == null || root2 == null) return root1 === root2
  return root1.val === root2.val &&
    (
      (flipEquiv(root1.left, root2.left) && flipEquiv(root1.right, root2.right)) ||
      (flipEquiv(root1.left, root2.right) && flipEquiv(root1.right, root2.left))
    )
};

