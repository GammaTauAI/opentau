const minimumMoves = function (arr) {
  const n = arr.length
  const dp = Array.from({ length: n }, () => Array(n).fill(n))
    for (let i = 0; i < n; i++) {
    dp[i][i] = 1
  }
    for (let i = 0; i < n - 1; i++) {
    dp[i][i + 1] = arr[i] === arr[i + 1] ? 1 : 2
  }
    for (let size = 3; size <= n; size++) {
    for (let left = 0, right = left + size - 1; right < n; left++, right++) {
                  if (arr[left] === arr[right]) {
        dp[left][right] = dp[left + 1][right - 1]
      }
                        for (let mid = left; mid < right; mid++) {
        dp[left][right] = Math.min(
          dp[left][right],
          dp[left][mid] + dp[mid + 1][right]
        )
      }
    }
  }
  return dp[0][n - 1]
}
 const minimumMoves = function (arr) {
  const n = arr.length
  const dp = Array.from({ length: n }, () => Array(n).fill(n))
  for(let i = 0; i < n; i++) dp[i][i] = 1
  for(let i = 0; i < n - 1; i++) {
    dp[i][i + 1] = arr[i] === arr[i + 1] ? 1 : 2
  }
  for(let size = 3; size <= n; size++) {
    for(let i = 0; i + size - 1 < n; i++) {
      const right = i + size - 1
      if(arr[i] === arr[right]) dp[i][right] = dp[i + 1][right - 1]
      for(let j = i; j < right; j++) {
        dp[i][right] = Math.min(dp[i][right], dp[i][j] + dp[j + 1][right])
      }
    }
  }
  return dp[0][n - 1]
}
