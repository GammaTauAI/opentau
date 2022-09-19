var minOperations = function(n) {
  let l = 1, r = 2 * (n - 1) + 1
            const target = l + (r - l) / 2
  let res = 0
  const num = ~~((n + 1) / 2)
  for(let i = 1; i <= num; i++) {
    res += target - (2 * (i -1) + 1)
  }
  return res
};
