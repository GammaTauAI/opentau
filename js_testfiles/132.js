








const minDistance = function(word1, word2) {
    let m = word1.length, n = word2.length;
    const dp = Array.from({length: m + 1}, ()=> new Array(n+ 1).fill(0))
    for (let i = 1; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 1; j <= n; j++) {
      dp[0][j] = j;
    }
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (word1[i - 1] === word2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(dp[i - 1][j - 1], Math.min(dp[i][j - 1], dp[i - 1][j])) + 1;
        }
      }
    }
    return dp[m][n];
};

// another






const minDistance = function(word1, word2) {
  const m = word1.length, n = word2.length
  const dp = Array(n + 1).fill(0)
  for(let i = 1; i <= n; i++) dp[i] = i 
  let pre = 0
  for(let i = 1; i <= m; i++) {
    pre = dp[0]
    dp[0] = i
    for(let j = 1; j <= n; j++) {
      let tmp = dp[j]
      if(word1[i - 1] === word2[j - 1]) {
        dp[j] = pre
      } else {
        dp[j] = Math.min(pre, dp[j],  dp[j - 1]) + 1
      }
      pre = tmp
    }
  }

  return dp[n]
};

