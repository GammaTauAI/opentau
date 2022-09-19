const digitsCount = function (d, low, high) {
  return countDigit(high, d) - countDigit(low - 1, d)
  function countDigit(n, d) {
    if (n < 0 || n < d) {
      return 0
    }
    let count = 0
    for (let i = 1; i <= n; i *= 10) {
      let divider = i * 10
      count += ((n / divider) >> 0) * i
      if (d > 0) {
                count += Math.min(Math.max((n % divider) - d * i + 1, 0), i)
      } else {
        if (n / divider > 0) {
          if (i > 1) {
                        count -= i
            count += Math.min((n % divider) + 1, i)
          }
        }
      }
    }
    return count
  }
}