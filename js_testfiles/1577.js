






const MaxStack = function() {
  this.stack = []
}





MaxStack.prototype.push = function(x) {
  this.stack.push(x)
}




MaxStack.prototype.pop = function() {
  return this.stack.pop()
}




MaxStack.prototype.top = function() {
  return this.stack[this.stack.length - 1]
}




MaxStack.prototype.peekMax = function() {
  return Math.max(...this.stack)
}




MaxStack.prototype.popMax = function() {
  const elem = Math.max(...this.stack)
  const index = this.stack.lastIndexOf(elem)
  return this.stack.splice(index, 1)[0]
}











