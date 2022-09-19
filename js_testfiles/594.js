










const findMaxAverage = function(nums, k) {
  let left = nums[0]
  let right = nums[0]
  nums.forEach(num => {
    left = Math.min(left, num)
    right = Math.max(right, num)
  })
  const check = average => {
    let rightSum = 0
    let leftSum = 0
    let minLeftSum = 0
    for (let i = 0; i < k; i++) {
      rightSum += nums[i] - average
    }
    for (let i = k; i <= nums.length; i++) {
      if (rightSum - minLeftSum >= 0) {
        return true
      }
      if (i < nums.length) {
        rightSum += nums[i] - average
        leftSum += nums[i - k] - average
        minLeftSum = Math.min(leftSum, minLeftSum)
      }
    }
    return false
  }
  while (left + 1e-5 < right) {
    let mid = (left + right) / 2
    if (check(mid)) {
      left = mid
    } else {
      right = mid
    }
  }
  return left
}

