const BSTIterator = function(root) {
  this.root = root;
  this.stack = [];
};
BSTIterator.prototype.next = function() {
  while (this.root) {
    this.stack.push(this.root);
    this.root = this.root.left;
  }
  this.root = this.stack.pop();
  const result = this.root.val;
  this.root = this.root.right;
  return result;
};
BSTIterator.prototype.hasNext = function() {
  return this.root || this.stack.length;
};
const BSTIterator = function(root) {
  this.generator = dfsGenerator(root)
  this.root = root
  this.nextSmall = this.generator.next().value
}
function* dfsGenerator(root) {
  if (root === null) return
  const stack = []
  let current = root
  while (true) {
    if (current) {
      stack.push(current)
      current = current.left
    } else if (stack.length) {
      const top = stack.pop()
      yield top.val
      current = top.right
    } else {
      break
    }
  }
}
BSTIterator.prototype.next = function() {
  const smallReturn = this.nextSmall
  this.nextSmall = this.generator.next().value
  return smallReturn
}
BSTIterator.prototype.hasNext = function() {
  return this.nextSmall !== undefined ? true : false
}
