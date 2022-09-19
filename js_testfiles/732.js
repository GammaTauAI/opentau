










const threeSumSmaller = function(nums, target) {
  nums.sort((a, b) => a - b)
  let res = 0
  for(let i = 0, len = nums.length; i < len - 2; i++) {
    let lo = i + 1
    let hi = len - 1
    while(lo < hi) {
      if(nums[i] + nums[lo] + nums[hi] < target) {
        res += hi - lo
        lo++
      } else hi--
    }
  }
  return res
};

