const isValidPalindrome = function(s, k) {
  const len = s.length
  const reverse = s.split('').reverse().join('')
  const lps = lcs(s, reverse, len, len)
  return len - lps <= k
};
function lcs(s1, s2, m, n) {
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for(let i = 1; i <= m; i++) {
    for(let j = 1; j <= n; j++) {
      if(s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  return dp[m][n]
}
const isValidPalindrome = function(s, k) {
  const len = s.length
  const cache = Array.from({ length: len }, () => new Array(len).fill(0))
  chk(s, 0, len - 1, cache)
  return cache[0][len - 1] <= k
};
function chk(s, l, r, cache) {
  if(l >= r) return 0
  if(cache[l][r]) return cache[l][r]
  let num = 0
  if(s[l] === s[r]) {
    num = chk(s, l + 1, r - 1, cache) 
  } else {
    num = 1 + Math.min(chk(s, l, r - 1, cache), chk(s, l + 1, r, cache))
  }
  cache[l][r] = num
  return num
}
const isValidPalindrome = function(s, k) {
  const len = s.length
  const dp = Array.from({ length: len }, () => new Array(len).fill(0))
  for(let i = len - 1; i >= 0; i--) {
    dp[i][i] = 1
    for(let j = i + 1; j < len; j++) {
      if(s[i] === s[j]) dp[i][j] = dp[i + 1][j - 1] + 2
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1])
    }
  }
  return len <= dp[0][len - 1] + k
};
