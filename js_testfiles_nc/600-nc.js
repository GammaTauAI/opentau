const canPermutePalindrome = function(s) {
  const m = {}
  for(let i = 0, len = s.length; i < len; i++) {
    if(m[s[i]] == null || m[s[i]] === 0) m[s[i]] = 1
    else m[s[i]] -= 1
  }
  let num = 0
  for(let el in m) {
    if(m.hasOwnProperty(el)) {
      if(m[el] > 0) num++
    }
  }
  return num === 0 || num === 1
};
