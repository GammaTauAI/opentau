










const maxSubArrayLen = function(nums, k) {
  let sum = 0, max = 0
  const m = new Map()
  for(let i = 0, len = nums.length; i < len; i++) {
    sum += nums[i]
    if(sum === k) max = i + 1
    else if(m.has(sum - k)) max = Math.max(max, i - m.get(sum - k))
    if(!m.has(sum)) m.set(sum, i)
  }
  return max
};

