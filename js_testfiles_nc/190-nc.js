const Vector2D = function(v) {
  this.a = []
  this.idx = 0
  v.forEach(el => this.a.push(...el))
};
Vector2D.prototype.next = function() {
  return this.a[this.idx++]
};
Vector2D.prototype.hasNext = function() {
  return this.idx <= this.a.length - 1
};
const Vector2D = function(v) {
  this.iterator = v[Symbol.iterator]()
  this.row = this.iterator.next()
  this.idx = 0
}
Vector2D.prototype.next = function() {
  if (this.hasNext()) {
    return this.row.value[this.idx++]
  }
}
Vector2D.prototype.hasNext = function() {
  while (this.row.done == false && this.idx == this.row.value.length) {
    this.row = this.iterator.next()
    this.idx = 0
  }
  return this.row.done == false
}
