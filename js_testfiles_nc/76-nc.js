const getHappyString = function(n, k) {
  const hash = {a: 'bc', b: 'ac', c: 'ab'}
  const q = ['a', 'b', 'c']
  while(q[0].length !== n) {
    const pre = q.shift()
    for(const ch of hash[pre[pre.length - 1]]) {
      q.push(pre + ch)
    }
  }
  return q.length >= k ? q[k - 1] : ''
};
var getHappyString = function(n, k) {
  const res = []
  dfs()
  return res.length === k ? res[res.length - 1] : ''
  function dfs(path = '') {
    if(res.length === k) return
    if(path.length === n) {
      res.push(path)
      return
    }
    for(const e of 'abc') {
      if(path === '' || e !== path[path.length - 1]) {
        dfs(path + e)
      }
    }
  }
};
