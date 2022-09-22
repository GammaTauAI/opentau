const RandomizedSet = function () {
  this.arr = []
  this.map = new Map()
}
RandomizedSet.prototype.insert = function (val) {
  const {arr, map} = this
  if(map.has(val)) return false
  const size = arr.length
  arr.push(val)
  map.set(val, size)
  return true
}
RandomizedSet.prototype.remove = function (val) {
  const {arr, map} = this
  if(!map.has(val)) return false
  const idx = map.get(val), last = arr[arr.length - 1]
  arr[idx] = last
  map.set(last, idx)
  arr.pop()
  map.delete(val)
  return true
}
RandomizedSet.prototype.getRandom = function () {
  return this.arr[~~(this.arr.length * Math.random())]
}
