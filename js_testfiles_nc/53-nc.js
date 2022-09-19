const threeEqualParts = function (A) {
  let countNumberOfOnes = 0
  for (let c of A) if (c === 1) countNumberOfOnes++
  if (countNumberOfOnes === 0) return [0, A.length - 1]
  if (countNumberOfOnes % 3 != 0) return [-1, -1]
  const k = countNumberOfOnes / 3
  let i
    for (i = 0; i < A.length; i++) if (A[i] == 1) break
  let start = i
    let count1 = 0
  for (i = 0; i < A.length; i++) {
    if (A[i] == 1) count1++
    if (count1 == k + 1) break
  }
  let mid = i
    count1 = 0
  for (i = 0; i < A.length; i++) {
    if (A[i] === 1) count1++
    if (count1 === 2 * k + 1) break
  }
  let end = i
    while (end < A.length && A[start] === A[mid] && A[mid] === A[end]) {
    start++
    mid++
    end++
  }
    if (end == A.length) return [start - 1, mid]
    return [-1, -1]
}
