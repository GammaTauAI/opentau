const lengthOfLongestSubstring = function(s) {
  if(s.length < 2) return s.length
  const hash = {}
  let max = 0
  for(let i = 0, j = -1, len = s.length; i < len; i++) {
    const cur = s[i]
    if(hash[cur] != null) j = Math.max(j, hash[cur])
    hash[cur] = i
    max = Math.max(max, i - j)
  }
  return max
};
const lengthOfLongestSubstring = function(s) {
      const sub = [];
  let max = 0;
  for (let i = 0; i < s.length; i++) {
    let index = sub.indexOf(s.charAt(i));
    if (index == -1) {
      sub.push(s.charAt(i));
          } else {
            sub = sub.slice(index + 1, sub.length);
      sub.push(s.charAt(i));
    }
    max = Math.max(max, sub.length);
  }
  return max;
};
