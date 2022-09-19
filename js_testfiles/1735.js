










const twoSumLessThanK = function(A, K) {
  A.sort((a, b) => a - b)
  let max = -1,
    i = 0,
    j = A.length - 1
  while (i < j) {
    const sum = A[i] + A[j]
    if (sum < K) {
      max = Math.max(max, sum)
      i++
    } else {
      j--
    }
  }
  return max
}

