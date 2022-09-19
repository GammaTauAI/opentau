const MinStack = function () {
  this.stack = []
  this.min = null
}
MinStack.prototype.push = function (x) {
  if (this.min === null) {
    this.min = x
  } else {
    this.min = Math.min(x, this.min)
  }
  return this.stack.push(x)
}
MinStack.prototype.pop = function () {
  let removed = this.stack.pop()
  if (this.min === removed) {
    this.min = this.stack.length > 0 ? Math.min(...this.stack) : null
  }
  return this.stack
}
MinStack.prototype.top = function () {
  return this.stack[this.stack.length - 1]
}
MinStack.prototype.getMin = function () {
  return this.min
}
