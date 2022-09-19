







const Solution = function (N, blacklist) {
  this.map = new Map()
  for (let b of blacklist) this.map.set(b, -1)
  this.M = N - this.map.size
  for (let b of blacklist) {
    if (b < this.M) {
      while (this.map.has(N - 1)) N--
      this.map.set(b, N - 1)
      N--
    }
  }
}




Solution.prototype.pick = function () {
  const p = Math.floor(Math.random() * this.M)
  if (this.map.has(p)) return this.map.get(p)
  return p
}







