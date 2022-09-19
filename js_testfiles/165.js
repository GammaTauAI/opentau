










const lengthOfLongestSubstringKDistinct = function(s, k) {
  const map = new Map()
  let left = 0
  let best = 0
  for(let i = 0; i < s.length; i++) {
    const c = s.charAt(i)
    map.set(c, (map.get(c) || 0) + 1)
    while(map.size > k) {
      const lc = s.charAt(left)
      map.set(lc, map.get(lc) - 1)
      if(map.get(lc) === 0) map.delete(lc)
      left++
    }
    best = Math.max(best, i - left + 1)
  }
  return best
};

