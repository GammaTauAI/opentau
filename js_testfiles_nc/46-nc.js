const BSTIterator = function(root) {
  this.r = root
  const ans = []
  helper(root, ans)
  this.arr = ans
  this.cur = -1
};
BSTIterator.prototype.hasNext = function() {
  return this.arr.length && this.cur < this.arr.length - 1
};
BSTIterator.prototype.next = function() {
  this.cur += 1
  return this.arr[this.cur]
};
BSTIterator.prototype.hasPrev = function() {
  return this.arr.length && this.cur > 0
};
BSTIterator.prototype.prev = function() {
  return this.arr[--this.cur]
};
function helper(node, res) {
  if(node == null) return
  if(node.left) {
    helper(node.left, res)
  }
  res.push(node.val)
  if(node.right) {
    helper(node.right, res)
  }
}
const BSTIterator = function (root) {
  this.nums = []
  this.stack = []
  this.node = root
  this.i = 0   this.size = 0
}
BSTIterator.prototype.hasNext = function () {
  return this.i < this.size || this.stack.length > 0 || !!this.node
}
BSTIterator.prototype.next = function () {
  if (this.i < this.size) return this.nums[this.i++]
  if (this.stack.length || this.node) {
    while (this.node) {
      this.stack.push(this.node)
      this.node = this.node.left
    }
    this.node = this.stack.pop()
    this.i += 1
    this.size += 1
    const val = this.node.val
    this.nums.push(val)
    this.node = this.node.right
    return val
  }
  return -1
}
BSTIterator.prototype.hasPrev = function () {
  return this.i - 2 >= 0
}
BSTIterator.prototype.prev = function () {
  return this.nums[--this.i - 1]
}
