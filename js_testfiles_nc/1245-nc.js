 const minimumFinishTime = function (tires, changeTime, numLaps) {
  tires = preprocess(tires)
  let n = tires.length
  const { max, min } = Math
      const pre = Array.from({ length: n }, () =>
    Array(20).fill(Infinity)
  )
  for (let i = 0; i < n; i++) {
    pre[i][1] = tires[i][0]
    for (let j = 2; j < 20; j++) {
      if (pre[i][j - 1] * tires[i][1] >= 2e9) break
      pre[i][j] = pre[i][j - 1] * tires[i][1]
    }
            for (let j = 2; j < 20; j++) {
      if (pre[i][j - 1] + pre[i][j] >= 2e9) break
      pre[i][j] += pre[i][j - 1]
    }
  }
    const dp = Array(numLaps + 1).fill(Infinity)
  for (let i = 0; i < n; i++) {
    dp[1] = min(dp[1], tires[i][0])
  }
  for (let x = 1; x <= numLaps; x++) {
    if (x < 20) {
            for (let i = 0; i < n; i++) {
        dp[x] = min(dp[x], pre[i][x])
      }
    }
    for (let j = x - 1; j > 0 && j >= x - 18; j--) {
      dp[x] = min(dp[x], dp[j] + changeTime + dp[x - j])
    }
  }
  return dp[numLaps]
}
function preprocess(tires) {
  tires.sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]))
  const res = []
  for (let t of tires) {
    if (res.length === 0 || res[res.length - 1][1] > t[1]) {
      res.push(t)
    }
  }
  return res
}
var minimumFinishTime = function (tires, changeTime, numLaps) {
  let N = tires.length,
    len = 0
  const { max, min } = Math
  const best = Array(numLaps).fill(Infinity),
    dp = Array(numLaps + 1).fill(Infinity)
  for (let i = 0; i < N; ++i) {
            let f = tires[i][0],
      r = tires[i][1],
      sum = changeTime,
      p = 1
    for (let j = 0; j < numLaps; ++j) {
      sum += f * p
                  if (f * p >= f + changeTime) break 
      best[j] = min(best[j], sum)
      len = max(len, j + 1)
      p *= r
    }
  }
    dp[0] = 0 
  for (let i = 0; i < numLaps; ++i) {
    for (let j = 0; j < len && i - j >= 0; ++j) {
            dp[i + 1] = min(dp[i + 1], dp[i - j] + best[j])
    }
  }
    return dp[numLaps] - changeTime 
}
