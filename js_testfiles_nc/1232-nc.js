const encode = function(strs) {
  let s = ''
  for(let e of strs) {
    s += e.length + '/' + e
  }
  return s
};
const decode = function(s) {
  const res = []
  let i = 0
  while(i < s.length) {
    const idx = s.indexOf('/', i)
    const size = s.slice(i, idx)
    i = idx + (+size) + 1
    res.push(s.slice(idx + 1, i))
  }
  return res
};
