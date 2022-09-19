const findMaxForm = function(strs, m, n) {
  const memo = Array.from(new Array(m + 1), () => new Array(n + 1).fill(0))
  let numZeroes
  let numOnes
  for (let s of strs) {
    numZeroes = numOnes = 0
        for (let c of s) {
      if (c === '0') numZeroes++
      else if (c === '1') numOnes++
    }
                            for (let i = m; i >= numZeroes; i--) {
      for (let j = n; j >= numOnes; j--) {
        memo[i][j] = Math.max(memo[i][j], memo[i - numZeroes][j - numOnes] + 1)
      }
    }
  }
  return memo[m][n]
}
