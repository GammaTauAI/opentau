const getFactors = function(n) {
  if (n <= 0) {
    return []
  }
  const result = []
  helper(n, result, [], 2)
  return result
}
const helper = (n, result, list, start) => {
  for (let i = start; i * i <= n; i++) {
    if (n % i === 0) {
      list.push(i)
      list.push(n / i)
      result.push(list.slice())
      list.pop()
      helper(n / i, result, list, i)
      list.pop()
    }
  }
}
