const Logger = function() {
  this.m = new Map()
};
Logger.prototype.shouldPrintMessage = function(timestamp, message) {
  if(!this.m.has(message)) {
    this.m.set(message, timestamp)
    return true
  }
  const p = this.m.get(message)
  const res = timestamp - p >= 10 ? true : false
  if(res) {
    this.m.set(message, timestamp)
    return true
  }
  return false
};
