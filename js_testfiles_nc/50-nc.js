const longestArithSeqLength = function(A) {
  let a = A
  let n = A.length
  if (n <= 2) return n;
  let i, j, k, d;
  let mxl = 2;
  let current;
  let last;
    for (i = 0; i < n - mxl; i++) {
        for (j = i + 1; j < n - mxl + 1; j++) {
            d = a[j] - a[i];
      last = a[j];
      current = 2;
      for (k = j + 1; k < n; k++) {
        if (a[k] - last == d) {
                    current++;
          last = a[k];
        }
      }
      mxl = Math.max(mxl, current);
    }
  }
  return mxl;
};
