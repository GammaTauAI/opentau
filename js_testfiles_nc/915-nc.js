const maxAlternatingSum = function(nums) {
  let odd = 0, even = 0;
  for (let a of nums) {
    even = Math.max(even, odd + a);
    odd = even - a;
  }
  return even;
};
const maxAlternatingSum = function(nums) {
  let res = nums[0]
  for(let i = 1; i < nums.length; i++) {
    res += Math.max(nums[i] - nums[i - 1], 0)
  }
  return res
};
