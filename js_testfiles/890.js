







const MyCircularDeque = function(k) {
  this.q = []
  this.k = k
};






MyCircularDeque.prototype.insertFront = function(value) {
  if(this.q.length < this.k) {
    this.q.unshift(value)
    return true
  }
  return false
};






MyCircularDeque.prototype.insertLast = function(value) {
  if(this.q.length < this.k) {
    this.q.push(value)
    return true
  }
  return false
};





MyCircularDeque.prototype.deleteFront = function() {
  if(this.q.length) {
    this.q.shift()
    return true
  }
  return false
};





MyCircularDeque.prototype.deleteLast = function() {
  if(this.q.length) {
    this.q.pop()
    return true
  }
  return false 
};





MyCircularDeque.prototype.getFront = function() {
  return this.q[0] === undefined ? -1 : this.q[0]
};





MyCircularDeque.prototype.getRear = function() {
  return this.q[this.q.length - 1] === undefined ? -1 : this.q[this.q.length - 1]
};





MyCircularDeque.prototype.isEmpty = function() {
  return this.q.length === 0
};





MyCircularDeque.prototype.isFull = function() {
  return this.q.length === this.k
};




