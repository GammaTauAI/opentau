const findMaxConsecutiveOnes = function(nums) {
  let max = 0,
    k = 1
  const zeroIndex = []
  for (let l = 0, h = 0; h < nums.length; h++) {
    if (nums[h] === 0) zeroIndex.push(h)
    if (zeroIndex.length > k) l = zeroIndex.shift() + 1
    max = Math.max(max, h - l + 1)
  }
  return max
}
