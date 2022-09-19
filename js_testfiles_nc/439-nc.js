const isOneEditDistance = function(s, t) {
  const m = s.length,
    n = t.length;
  if (m > n) {
    return isOneEditDistance(t, s);
  }
  for (let i = 0; i < m; i++) {
    if (s[i] !== t[i]) {
      if (m === n) {
        return s.slice(i + 1) === t.slice(i + 1);
      }
      return s.slice(i) === t.slice(i + 1);
    }
  }
  return m + 1 === n;
};
