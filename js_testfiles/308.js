







const maxSizeSlices = function (slices) {
  const m = slices.length,
    n = (m / 3) >> 0
  const slices1 = slices.slice(0, m - 1)
  const slices2 = slices.slice(1, m)
  return Math.max(maxSum(slices1, n), maxSum(slices2, n))
}

function maxSum(arr, n) {
  // max sum when pick `n` non-adjacent elements from `arr`
  const m = arr.length
  // dp[i][j] is maximum sum which we pick `j` elements from linear array `i` elements
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  // Case j = 0 (pick 0 elements): dp[i][0] = 0
  // Case i = 0 (array is empty): dp[0][j] = 0
  for (let i = 1; i <= m; ++i) {
    for (let j = 1; j <= n; ++j) {
      if (i === 1) {
        // array has only 1 element
        // pick that element
        dp[i][j] = arr[0]
      } else {
        dp[i][j] = Math.max(
          // don't pick element `ith`
          dp[i - 1][j],
          // pick element `ith` -> dp[i-2][j-1] means choose `j-1` elements from array `i-2` elements
          // because we exclude adjacent element `(i-1)th`
          dp[i - 2][j - 1] + arr[i - 1]
        )
      }
    }
  }
  return dp[m][n]
}


// another





const maxSizeSlices = function (slices) {
  const n = slices.length, m = ~~(n / 3)
  const arr1 = slices.slice(1), arr2 = slices.slice(0, n - 1)
  return Math.max(helper(arr1, m), helper(arr2, m))
  function helper(arr, k) {
    const len = arr.length
    const dp = Array.from({ length: len + 1 }, () => Array(k + 1).fill(0))
    for(let i = 1; i <= len; i++) {
      for(let j = 1; j <= k; j++) {
        if(i === 1) dp[i][j] = arr[i - 1]
        else {
          dp[i][j] = Math.max(
            dp[i - 1][j],
            dp[i - 2][j - 1] + arr[i - 1]
          )
        }
      }
    }
    return dp[len][k]
  }
}

