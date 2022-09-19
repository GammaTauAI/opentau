









const getMoneyAmount = function(n) {
  const dp = Array.from({length: n + 1}, () => new Array(n + 1).fill(0))
  return helper(dp, 1, n)
};

function helper(dp, s, e) {
  if(s >= e) return 0
  if(dp[s][e] !== 0) return dp[s][e]
  let res = Number.MAX_VALUE
  for(let i = s; i <= e; i++) {
    const tmp = i + Math.max(helper(dp, s, i - 1), helper(dp, i + 1, e))
    res = Math.min(res, tmp)
  }
  dp[s][e] = res
  return res
}

