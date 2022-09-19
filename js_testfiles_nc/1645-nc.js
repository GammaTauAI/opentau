const stoneGameII = function(piles) {
  let sums = []   let hash = []
  if (piles == null || piles.length == 0) return 0
  let n = piles.length
  sums = new Array(n)
  sums[n - 1] = piles[n - 1]
  for (let i = n - 2; i >= 0; i--) {
    sums[i] = sums[i + 1] + piles[i]   }
  hash = Array.from({ length: n }, () => new Array(n).fill(0))
  return helper(piles, 0, 1)
  function helper(a, i, M) {
    if (i == a.length) return 0
    if (2 * M >= a.length - i) {
      return sums[i]
    }
    if (hash[i][M] != 0) return hash[i][M]
    let min = Number.MAX_SAFE_INTEGER     for (let x = 1; x <= 2 * M; x++) {
      min = Math.min(min, helper(a, i + x, Math.max(M, x)))
    }
    hash[i][M] = sums[i] - min     return hash[i][M]
  }
}
