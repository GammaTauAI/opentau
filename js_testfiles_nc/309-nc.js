const PhoneDirectory = function(maxNumbers) {
  this.len = maxNumbers
  this.used = new Set()
  this.free = []
}
PhoneDirectory.prototype.get = function() {
  if (this.used.size === this.len) return -1
  const tmp = this.free.length === 0 ? this.used.size : this.free.pop()
  this.used.add(tmp)
  return tmp
}
PhoneDirectory.prototype.check = function(number) {
  return !this.used.has(number)
}
PhoneDirectory.prototype.release = function(number) {
  if(this.used.has(number)) {
    this.used.delete(number)
    this.free.push(number)
  }
}
