







const MyCircularQueue = function (k) {
  this.a = new Array(k).fill(0)
  this.front = 0
  this.rear = -1
  this.len = 0
}






MyCircularQueue.prototype.enQueue = function (value) {
  if (!this.isFull()) {
    this.rear = (this.rear + 1) % this.a.length
    this.a[this.rear] = value
    this.len++
    return true
  } else return false
}





MyCircularQueue.prototype.deQueue = function () {
  if (!this.isEmpty()) {
    this.front = (this.front + 1) % this.a.length
    this.len--
    return true
  } else return false
}





MyCircularQueue.prototype.Front = function () {
  return this.isEmpty() ? -1 : this.a[this.front]
}





MyCircularQueue.prototype.Rear = function () {
  return this.isEmpty() ? -1 : this.a[this.rear]
}





MyCircularQueue.prototype.isEmpty = function () {
  return this.len === 0
}





MyCircularQueue.prototype.isFull = function () {
  return this.len == this.a.length
}




