const SparseVector = function(nums) {
  this.seen = {}
  nums.forEach((e, i) => {
    if(e !== 0) this.seen[i] = e
  })
};
SparseVector.prototype.dotProduct = function(vec) {
  let res = 0
  for(let [k, v] of Object.entries(vec.seen)) {
    if(k in this.seen) res += v * this.seen[k]
  }
  return res
};
class SparseVector {
  constructor(nums) {
        this.seen = new Map()     for (let i = 0; i < nums.length; ++i) {
      if (nums[i] !== 0) {
        this.seen.set(i, nums[i])
      }
    }
  }
  dotProduct(vec) {
        let sum = 0
    for (const [i, val] of vec.seen) {
      if (this.seen.has(i)) {
        sum += val * this.seen.get(i)
      }
    }
    return sum
  }
}
