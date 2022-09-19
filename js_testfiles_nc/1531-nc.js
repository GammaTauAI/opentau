const minDeletionSize = function (A) {
  let res = 0,
    i,
    j   const n = A.length,
    m = A[0].length,
    sorted = new Array(n - 1).fill(false)
  for (j = 0; j < m; ++j) {
        for (i = 0; i < n - 1; ++i) {
            if (!sorted[i] && A[i].charAt(j) > A[i + 1].charAt(j)) {
        res++
        break
      }
    }
    if (i < n - 1) continue
                        for (
      i = 0;
      i < n - 1;
      ++i     )
      if (A[i].charAt(j) < A[i + 1].charAt(j)) sorted[i] = true
  }
  return res
}
const minDeletionSize = function (A) {
  const set = new Set()
  const m = A.length
  let res = 0
  if(m === 0) return 0
  const n = A[0].length
  for(j = 0; j < n; j++) {
    if(set.size === m - 1) return res
    for(i = 0; i < m - 1; i++) {
      if(!set.has(i) && A[i][j] > A[i + 1][j]) {
        res++
        break
      }
    }
    if(i < m - 1) continue
    for(i = 0; i < m - 1; i++) {
      if(A[i][j] < A[i + 1][j]) set.add(i)
    }
  }
  return res
}
