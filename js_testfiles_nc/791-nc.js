const numWays = function(n, k) {
  if (n === 0) return 0;
  if (n === 1) return k;
  let diff = k * (k - 1);
  let same = k;
  for (let i = 2; i < n; i ++) {
    const temp = diff;
    diff = (diff + same) * (k - 1);
    same = temp;
  }
  return diff + same;
}
