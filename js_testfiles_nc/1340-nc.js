const SmallestInfiniteSet = function() {
  this.nums = new Set(Array.from({ length: 1001 }, (e, i) => i + 1))
  this.tmp = new Set()
};
SmallestInfiniteSet.prototype.popSmallest = function() {
  const min = Math.min(...this.nums)
  this.nums.delete(min)
  this.tmp.add(min)
  return min
};
SmallestInfiniteSet.prototype.addBack = function(num) {
  if(this.tmp.has(num)) {
    this.tmp.delete(num)
    this.nums.add(num)
  } 
};
