



const StockSpanner = function() {
  this.values = []
}





StockSpanner.prototype.next = function(price) {
  let count = 1
  while (
    this.values.length > 0 &&
    this.values[this.values.length - 1][0] <= price
  ) {
    count += this.values.pop()[1]
  }
  this.values.push([price, count])
  return count
}







