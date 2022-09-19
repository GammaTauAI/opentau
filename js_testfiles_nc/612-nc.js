const countSubstrings = function (s, t) {
  const m = s.length
  const n = t.length
  const matrix = (m, n, v) => Array.from({ length: m }, () => Array(n).fill(v))
    const same = matrix(m + 1, n + 1, 0)
    const one = matrix(m + 1, n + 1, 0)
  let result = 0
  for (let i = 1; i <= m; ++i) {
    for (let j = 1; j <= n; ++j) {
      if (s[i - 1] == t[j - 1]) {
        same[i][j] = same[i - 1][j - 1] + 1
        one[i][j] = one[i - 1][j - 1]
      } else {
        one[i][j] = same[i - 1][j - 1] + 1
      }
      result += one[i][j]
    }
  }
  return result
}
