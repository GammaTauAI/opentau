











const missingElement = function(nums, k) {
  for (let i = 1, len = nums.length; i < len; i++) {
    const dif = nums[i] - nums[i - 1] - 1
    if (dif >= k) {
      return nums[i - 1] + k
    }
    k -= dif
  }
  return nums[nums.length - 1] + k
}

// another






const missingElement = function(nums, k) {
  const n = nums.length
  let l = 0
  let h = n - 1
  const missingNum = nums[n - 1] - nums[0] + 1 - n
  if (missingNum < k) {
    return nums[n - 1] + k - missingNum
  }
  while (l < h - 1) {
    const m = l + ((h - l) >> 1)
    const missing = nums[m] - nums[l] - (m - l)
    if (missing >= k) {
      h = m
    } else {
      k -= missing
      l = m
    }
  }
  return nums[l] + k
}

// another






const missingElement = function(nums, k) {
  const n = nums.length
  if (k > missing(nums, n - 1)) return nums[n - 1] + k - missing(nums, n - 1)
  let left = 0,
    right = n - 1,
    pivot
  while (left < right) {
    pivot = left + Math.floor((right - left) / 2)
    if (missing(nums, pivot) < k) left = pivot + 1
    else right = pivot
  }
  return nums[left - 1] + k - missing(nums, left - 1)
}
function missing(arr, idx) {
  return arr[idx] - arr[0] - idx
}


