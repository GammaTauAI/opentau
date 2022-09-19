







const Solution = function(n_rows, n_cols) {
  this.r = n_rows
  this.c = n_cols
  this.total = n_rows * n_cols
  this.m = new Map()
}




Solution.prototype.flip = function() {
  const r = (Math.random() * this.total--) >> 0
  const i = this.m.get(r) || r
  this.m.set(r, this.m.get(this.total) || this.total)
  return [(i / this.c) >> 0, i % this.c]
}




Solution.prototype.reset = function() {
  this.m.clear()
  this.total = this.c * this.r
}








