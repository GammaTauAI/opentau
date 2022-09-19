









const cherryPickup = grid => {
  const n = grid.length
  const dp = [...new Array(n)].map(() =>
    [...new Array(n)].map(() => Array(n).fill(-Infinity))
  )
  dp[0][0][0] = grid[0][0]
  const go = (x1, y1, x2) => {
    const y2 = x1 + y1 - x2
    if (x1 < 0 || y1 < 0 || x2 < 0 || y2 < 0) return -1
    if (grid[y1][x1] === -1 || grid[y2][x2] === -1) return -1
    if (dp[y1][x1][x2] !== -Infinity) return dp[y1][x1][x2]
    dp[y1][x1][x2] = Math.max(
      go(x1 - 1, y1, x2 - 1),
      go(x1, y1 - 1, x2),
      go(x1, y1 - 1, x2 - 1),
      go(x1 - 1, y1, x2)
    )
    if (dp[y1][x1][x2] >= 0) {
      dp[y1][x1][x2] += grid[y1][x1]
      if (x1 !== x2) dp[y1][x1][x2] += grid[y2][x2]
    }
    return dp[y1][x1][x2]
  }
  return Math.max(0, go(n - 1, n - 1, n - 1))
}

