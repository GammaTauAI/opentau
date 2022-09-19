const Solution = function(nums) {
  this.nums = nums;
};
Solution.prototype.pick = function(target) {
  const res = [];
  for (let i = 0; i < this.nums.length; i++) {
    if (this.nums[i] === target) {
      res.push(i);
    }
  }
  return res[Math.floor(Math.random() * res.length)];
};
