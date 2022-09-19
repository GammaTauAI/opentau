






const Solution = function(nums) {
  this.original = nums;
};




Solution.prototype.reset = function() {
  return this.original;
};





Solution.prototype.shuffle = function() {
  const res = [];
  const len = this.original.length;
  let idx = 0;
  let i = 0;
  while (idx <= len - 1) {
    i = Math.floor(Math.random() * len);
    if (res[i] == null) {
      res[i] = this.original[idx];
      idx += 1;
    }
  }
  return res;
};








