const findMin = function (nums) {
  let low = 0,
    high = nums.length - 1
            while (low < high) {
    const mid = low + ((high - low) >> 1)
    if (nums[mid] <= nums[high]) high = mid
    else if (nums[mid] > nums[high]) low = mid + 1
  }
  return nums[low]
}
