




var MyQueue = function() {
  this.input = []
  this.output = []
};





MyQueue.prototype.push = function(x) {
  this.input.push(x)
};




MyQueue.prototype.pop = function() {
  if(this.output.length === 0) {
      while(this.input.length) {
          this.output.push(this.input.pop())
      }
  }
  return this.output.pop()
};




MyQueue.prototype.peek = function() {
  return this.output[this.output.length - 1] || this.input[0]
};




MyQueue.prototype.empty = function() {
  return this.input.length === 0 && this.output.length === 0
};










