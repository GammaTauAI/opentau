









const findContestMatch = function(n) {
  const arr = []
  for(let i = 0; i < n; i++) {
    arr[i] = i + 1
  }
  while(n > 1) {
    for(let i = 0; i < (n >> 1); i++) {
      arr[i] = `(${arr[i]},${arr[n - 1 - i]})`
    }
    n = n >> 1
  }
  return arr[0]
};

// another





const findContestMatch = function(n) {
  const arr = []
  for(let i = 0; i < n; i++) {
    arr[i] = i + 1
  }
  let l = 0
  let r = n - 1
  while(l < r) {
    while(l < r) {
      arr[l] = `(${arr[l]},${arr[r]})`
      l++
      r--
    }
    l = 0
  }
  return arr[0]
};

