const MovingAverage = function(size) {
  this.limit = size
  this.arr = []
  this.sum = 0
};
MovingAverage.prototype.next = function(val) {
  this.arr.push(val)
  this.sum += val
  if(this.arr.length > this.limit) {
    const tmp = this.arr[0]
    this.arr.shift()
    this.sum -= tmp
  }
  return this.sum / this.arr.length
};
