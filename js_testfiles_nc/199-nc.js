const OrderedStream = function(n) {
  this.arr = Array(n + 1)
  this.ptr = 1
};
OrderedStream.prototype.insert = function(id, value) {
  this.arr[id] = value
  const res = []
  let i
  for(i = this.ptr, len = this.arr.length; i < len; i++) {
    if (this.arr[i] != null) res.push(this.arr[i])
    else {
      break
    }
  }
  this.ptr = i
  return res
};
