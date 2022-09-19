const wiggleSort = function(nums) {
  for (let i = 1; i < nums.length; i++) {
    let a = nums[i - 1]
    if ((i % 2 === 1) === a > nums[i]) {
      nums[i - 1] = nums[i]
      nums[i] = a
    }
  }
}
