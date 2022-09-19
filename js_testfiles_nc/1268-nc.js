const stoneGameVIII = function (A) {
  let N = A.length,
    ans = -Infinity
  for (let i = 1; i < N; ++i) A[i] += A[i - 1]   let mx = A[N - 1]   for (let i = N - 2; i >= 0; --i) {
    ans = Math.max(ans, mx)     mx = Math.max(mx, A[i] - mx)   }
  return ans
}
