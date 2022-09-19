const minOperations = function(grid, x) {
  const arr = []
  const m = grid.length, n = grid[0].length
  for(let i = 0; i < m; i++) {
    for(let j = 0; j < n; j++) {
      arr.push(grid[i][j])
    }
  }
  arr.sort((a, b) => a - b)
  for(let i = 1; i < m * n; i++) {
    if((arr[i] - arr[i - 1]) % x !== 0) return -1
  }
  const sum = arr.reduce((ac, e) => ac + e, 0)
  const pre = []
  pre.push(arr[0])
  for(let i = 1; i < m * n; i++) {
    pre[i] = pre[i - 1] + arr[i]
  }
  let res = 0, num = 0, min = sum - arr[0] * m * n, idx = 0
  for(let i = 1; i < m * n; i++) {
    const cur = (i + 1) * arr[i] - pre[i] + (sum - pre[i] - arr[i] * (m * n - i - 1))
            if(cur < min) {
      idx = i
      min = cur
    }
  }
    for(let i = 0; i < m * n; i++) {
    if(i === idx) continue
    res += Math.abs(arr[i] - arr[idx]) / x
  }
  return res
};
const minOperations = function(grid, x) {
  const arr = [], m = grid.length, n = grid[0].length
  for(let i  =  0; i < m; i++) {
    for(let j = 0; j < n; j++) {
      arr.push(grid[i][j])
    }
  }
  arr.sort((a,  b) => a - b)
  const mid = arr[~~((m * n) / 2)]
  let res = 0
  for(let e of arr) {
    if (e !== mid) {
      const cur  = Math.abs(e - mid)
      if(cur  % x !== 0) return -1
      res += cur / x
    }
  }
  return res
};
function minOperations(grid, x) {
  const m = grid.length, n = grid[0].length, mn = m * n, arr = []
  for(let i = 0; i < m; i++) {
    for(let j = 0; j < n; j++) {
      arr.push(grid[i][j])
    }
  }
  arr.sort((a, b) => a - b)
  const mid = arr[~~(mn / 2)]
  let res = 0
  for(let e of arr) {
    if(e !== mid) {
      const delta = Math.abs(e - mid)
      if(delta % x !== 0) return -1
      res += delta / x
    }
  }
  return res
};
