const numSquares = function(n) {
    const dp = new Array(n+1).fill(Number.MAX_VALUE)
    dp[0] = 0
    for(let i = 1; i <= n; i++) {
        let min = Number.MAX_VALUE
        let j = 1
        while(i - j*j >= 0) {
            min = Math.min(min, dp[i-j*j] + 1)
            ++j
        }
        dp[i] = min
    }
    return dp[n]
};
const numSquares = function (n) {
  if (n <= 0) return 0
    const cntPerfectSquares = [0]
      while (cntPerfectSquares.length <= n) {
    const m = cntPerfectSquares.length
    let cntSquares = Number.MAX_VALUE
    for (let i = 1; i * i <= m; i++) {
      cntSquares = Math.min(cntSquares, cntPerfectSquares[m - i * i] + 1)
    }
    cntPerfectSquares.push(cntSquares)
  }
  return cntPerfectSquares[n]
}
const numSquares = function (n) {
        if (is_square(n)) {
    return 1
  }
        while ((n & 3) === 0) {
        n >>= 2
  }
  if ((n & 7) === 7) {
        return 4
  }
    let sqrt_n = Math.sqrt(n) >> 0
  for (let i = 1; i <= sqrt_n; i++) {
    if (is_square(n - i * i)) {
      return 2
    }
  }
  return 3
  function is_square(n) {
    const sqrt_n = Math.sqrt(n) >> 0
    return sqrt_n * sqrt_n == n
  }
}
