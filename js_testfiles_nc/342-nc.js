const StockPrice = function () {
  this.timeToPrice = new Map()
  this.lastTime = 0
  this.minPrices = new MinPriorityQueue({ priority: (stock) => stock.price })
  this.maxPrices = new MaxPriorityQueue({ priority: (stock) => stock.price })
}
StockPrice.prototype.update = function (timestamp, price) {
  this.timeToPrice.set(timestamp, price)
  this.lastTime = Math.max(this.lastTime, timestamp)
  this.minPrices.enqueue({ timestamp, price })
  this.maxPrices.enqueue({ timestamp, price })
}
StockPrice.prototype.current = function () {
  return this.timeToPrice.get(this.lastTime)
}
StockPrice.prototype.maximum = function () {
  while (
    this.maxPrices.front().element.price !==
    this.timeToPrice.get(this.maxPrices.front().element.timestamp)
  ) {
    this.maxPrices.dequeue()
  }
  return this.maxPrices.front().element.price
}
StockPrice.prototype.minimum = function () {
  while (
    this.minPrices.front().element.price !==
    this.timeToPrice.get(this.minPrices.front().element.timestamp)
  ) {
    this.minPrices.dequeue()
  }
  return this.minPrices.front().element.price
}
