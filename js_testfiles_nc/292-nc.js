const maxSizeSlices = function (slices) {
  const m = slices.length,
    n = (m / 3) >> 0
  const slices1 = slices.slice(0, m - 1)
  const slices2 = slices.slice(1, m)
  return Math.max(maxSum(slices1, n), maxSum(slices2, n))
}
function maxSum(arr, n) {
    const m = arr.length
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
      for (let i = 1; i <= m; ++i) {
    for (let j = 1; j <= n; ++j) {
      if (i === 1) {
                        dp[i][j] = arr[0]
      } else {
        dp[i][j] = Math.max(
                    dp[i - 1][j],
                              dp[i - 2][j - 1] + arr[i - 1]
        )
      }
    }
  }
  return dp[m][n]
}
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
