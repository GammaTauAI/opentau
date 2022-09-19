const shuffle = function(nums, n) {
  const res = []
  for(let i = 0; i < n; i++) {
    res.push(nums[i], nums[i + n])
  }
  return res
};
