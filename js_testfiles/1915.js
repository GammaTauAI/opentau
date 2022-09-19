








const shortestWay = function(source, target) {
  const a = 'a'.charCodeAt(0), arr = Array(26).fill(0)
  for(const ch of source) arr[ch.charCodeAt(0) - a] = 1
  let res = 0, j = 0
  for(let i = 0, n = source.length; i < n; i++) {
    if(arr[target[j].charCodeAt(0) - a] === 0) return -1
    if(source[i] === target[j]) j++
    if(j === target.length) {
      res++
      break
    }
    if(i === n - 1) {
      res++
      i = -1
    }
  }
  
  return res
};

// another






const shortestWay = function(source, target) {
  const a = 'a'.charCodeAt(0), map = Array(26).fill(0)
  for(let ch of source) {
    map[ch.charCodeAt(0) - a] = 1
  }
  let j = 0, res = 1
  for(let i = 0, n = target.length; i < n; i++, j++) {
    const cur = target[i]
    if(map[cur.charCodeAt(0) - a] === 0) return -1
    while(j < source.length && source[j] !== cur) {
      j++
    }
    if(j === source.length) {
      res++
      j = -1
      i--
    }
  }
  
  return res
};

