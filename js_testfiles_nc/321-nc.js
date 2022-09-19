const minNumberOfSemesters = function (n, dependencies, k) {
  const preq = new Array(n).fill(0)
  for (let dep of dependencies) {
                preq[dep[1] - 1] |= 1 << (dep[0] - 1)
  }
  const dp = new Array(1 << n).fill(n)
  dp[0] = 0
  for (let i = 0; i < 1 << n; i++) {
        let canStudy = 0     for (let j = 0; j < n; j++) {
                  if ((i & preq[j]) == preq[j]) {
        canStudy |= 1 << j
      }
    }
    canStudy &= ~i
                for (let sub = canStudy; sub > 0; sub = (sub - 1) & canStudy) {
                                                if (bitCount(sub) <= k) {
        dp[i | sub] = Math.min(dp[i | sub], dp[i] + 1)
      }
    }
  }
  return dp[(1 << n) - 1]
}
function bitCount(n) {
  n = n - ((n >> 1) & 0x55555555)
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
  return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24
}
