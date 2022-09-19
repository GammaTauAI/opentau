const diStringMatch = function(S) {
  const N = S.length
  const arr = []
  for(let i = 0; i <= N; i++) {
    arr[i] = i
  }
  const res = []
  for(let i = 0; i < N; i++) {
    if(S[i] === 'I') {
      res.push(arr.shift())
    } else if(S[i] === 'D') {
      res.push(arr.pop())
    }
  }
  res.push(arr.pop())
  return res
};
const diStringMatch = function(s) {
  const n = s.length
  let l = 0, r = n
  const res = []
  for(let i = 0; i < n; i++) {
    res.push(s[i] === 'I' ? l++ : r--)
  }
  res.push(r)
  return res
};
