const FrontMiddleBackQueue = function() {
  this.arr = []
};
FrontMiddleBackQueue.prototype.pushFront = function(val) {
  this.arr.unshift(val)
};
FrontMiddleBackQueue.prototype.pushMiddle = function(val) {
  const len = this.arr.length
  const mid = Math.floor(len / 2)
  this.arr.splice(mid, 0, val)
};
FrontMiddleBackQueue.prototype.pushBack = function(val) {
  this.arr.push(val)
};
FrontMiddleBackQueue.prototype.popFront = function() {
  const tmp = this.arr.shift()
  return tmp == null ? -1 : tmp
};
FrontMiddleBackQueue.prototype.popMiddle = function() {
  const len = this.arr.length
  const mid = len % 2 === 0 ? Math.floor(len / 2) - 1 : ((len / 2) >> 0)
  if(len === 2) return this.arr.shift()
  const [tmp] = this.arr.splice(mid, 1)
  return tmp == null ? -1 : tmp
};
FrontMiddleBackQueue.prototype.popBack = function() {
  const tmp = this.arr.pop()
  return tmp == null ? -1 : tmp
};
