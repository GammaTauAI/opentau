







const SparseVector = function(nums) {
  this.seen = {}
  nums.forEach((e, i) => {
    if(e !== 0) this.seen[i] = e
  })
};

// Return the dotProduct of two sparse vectors




SparseVector.prototype.dotProduct = function(vec) {
  let res = 0
  for(let [k, v] of Object.entries(vec.seen)) {
    if(k in this.seen) res += v * this.seen[k]
  }
  return res
};

// Your SparseVector object will be instantiated and called as such:
// let v1 = new SparseVector(nums1);
// let v2 = new SparseVector(nums2);
// let ans = v1.dotProduct(v2);

// another

class SparseVector {
  



  constructor(nums) {
    // Space: O(n)
    this.seen = new Map() // index -> value
    for (let i = 0; i < nums.length; ++i) {
      if (nums[i] !== 0) {
        this.seen.set(i, nums[i])
      }
    }
  }

  




  dotProduct(vec) {
    // Time: O(n)
    let sum = 0
    for (const [i, val] of vec.seen) {
      if (this.seen.has(i)) {
        sum += val * this.seen.get(i)
      }
    }
    return sum
  }
}

// Your SparseVector object will be instantiated and called as such:
// let v1 = new SparseVector(nums1);
// let v2 = new SparseVector(nums2);
// let ans = v1.dotProduct(v2);

