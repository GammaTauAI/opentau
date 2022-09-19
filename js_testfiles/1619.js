









// @lc code=start

const ProductOfNumbers = function() {
  this.sum = [1]
};





ProductOfNumbers.prototype.add = function(num) {
  if(num > 0) {
    this.sum.push(this.sum[this.sum.length - 1] * num)
  } else {
    this.sum = [1]
  }
};





ProductOfNumbers.prototype.getProduct = function(k) {
  const len = this.sum.length
  return k < len ? this.sum[len - 1] / this.sum[len - 1 - k] : 0
};








