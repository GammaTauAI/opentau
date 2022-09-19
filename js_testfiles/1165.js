

















const closestValue = function(root, target) {
  let res = root.val
  while(root) {
    if(Math.abs(root.val - target) < Math.abs(res - target)) {
      res = root.val
    }
    root = root.val > target ? root.left : root.right
  }
  return res
};

// another

const closestValue = function(root, target) {
  const child = target < root.val ? root.left : root.right;
  if (!child) return root.val;
  const closest = closestValue(child, target);
  return Math.abs(closest - target) < Math.abs(root.val - target)
    ? closest
    : root.val;
};

// another

const closestValue = function(root, target) {
  if(root == null) return -1
  let node = root
  const stack = []
  const res = []
  const K = 1
  while(node || stack.length) {
    if(node) {
      stack.push(node)
      node = node.left
    } else {
      node = stack.pop()
      if(res.length === K) {
        if(Math.abs(res[0] - target) < Math.abs(node.val - target)) {
          return res[0]   
        }
        res.shift()
      }
      res.push(node.val)
      node = node.right
    }
  }
  return res[0]
};

