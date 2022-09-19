









const isAdditiveNumber = function(num) {
  const n = num.length
  for (let i = 1; i <= (n / 2) >> 0; ++i) {
    if (num.charAt(0) === '0' && i > 1) return false
    const x1 = +num.slice(0, i)
    for (let j = 1; Math.max(j, i) <= n - i - j; ++j) {
      if (num.charAt(i) == '0' && j > 1) break
      const x2 = +num.slice(i, i + j)
      if (isValid(x1, x2, j + i, num)) return true
    }
  }
  return false
}

function isValid(x1, x2, start, num) {
  if (start === num.length) return true
  x2 = x2 + x1
  x1 = x2 - x1
  const sum = x2 + ''
  return num.startsWith(sum, start) && isValid(x1, x2, start + sum.length, num)
}

