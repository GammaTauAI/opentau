






const BrowserHistory = function(homepage) {
  this.idx = 0
  this.last = 0
  this.arr = [homepage]
};





BrowserHistory.prototype.visit = function(url) {
  this.idx++
  this.arr[this.idx] = url
  this.last = this.idx
};





BrowserHistory.prototype.back = function(steps) {
  const idx = this.idx
  let tmp = idx - steps
  if(tmp < 0) {
    this.idx = 0
    return this.arr[0]
  } else {
    this.idx = tmp
    return this.arr[tmp]
  }
};





BrowserHistory.prototype.forward = function(steps) {
  const n = this.last + 1
  let tmp = this.idx + steps
  if(tmp >= n) {
    this.idx  = n - 1
    return this.arr[n - 1]
  } else {
    this.idx = tmp
    return this.arr[tmp]
  }
};

