const HitCounter = function() {
  this.times = []
  this.hits = []
}
HitCounter.prototype.hit = function(timestamp) {
  const idx = timestamp % 300
  const times = this.times
  const hits = this.hits
  if (times[idx] !== timestamp) {
    times[idx] = timestamp
    hits[idx] = 1
  } else {
    hits[idx]++
  }
}
HitCounter.prototype.getHits = function(timestamp) {
  let total = 0
  const times = this.times
  const hits = this.hits
  for (let i = 0; i < 300; i++) {
    if (timestamp - times[i] < 300) {
      total += hits[i]
    }
  }
  return total
}
