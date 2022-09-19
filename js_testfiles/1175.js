







const integerBreak = function(n) {
  const dp = Array(n + 1).fill(0)
  dp[2] = 1
  for(let i = 3; i <= n; i++) {
    for(let j = 1; j < i; j++) {
      dp[i] = Math.max(dp[i], j * Math.max(i - j, dp[i - j]))
    }
  }
  return dp[n]
};

// another





const integerBreak = function(n) {
  if (n <= 2) return 1;

  const maxArr = [];
  for (let i = 0; i < n + 1; i++) {
    maxArr[i] = 0;
  }

  


  maxArr[1] = 0;
  maxArr[2] = 1; // 2=1+1 so maxArr[2] = 1*1

  for (let i = 3; i <= n; i++) {
    for (let j = 1; j < i; j++) {
      








      maxArr[i] = Math.max(maxArr[i], j * (i - j), j * maxArr[i - j]);
    }
  }
  return maxArr[n];
};

// another





const integerBreak = function(n) {
  if(n === 2) return 1
  if(n === 3) return 2
  let num = ~~(n / 3)
  let rem = n % 3
  if(rem === 1) {
    rem += 3
    num--
  }
  return rem === 0 ? Math.pow(3, num) : Math.pow(3, num) * rem
};




