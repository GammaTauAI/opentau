






const MyStack = function() {
    this.stack = []
};






MyStack.prototype.push = function(x) {
    this.stack.push(x)
};





MyStack.prototype.pop = function() {
    return this.stack.pop()
};





MyStack.prototype.top = function() {
    return this.stack.length === 0 ? null : this.stack[this.stack.length - 1]
};





MyStack.prototype.empty = function() {
    return this.stack.length === 0
};










