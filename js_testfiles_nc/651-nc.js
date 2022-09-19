const rangeBitwiseAnd = function(m, n) {
  while(m<n) n = n & (n-1);
  return n;
};
const rangeBitwiseAnd = function(m, n) {
  let s = 0
  while(m !== n) {
    m >>= 1
    n >>= 1
    s++
  }
  return m << s
};
