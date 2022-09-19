const maxSatisfaction = function (satisfaction, max = 0) {
  satisfaction.sort((a, b) => a - b)
  let res = 0
  let total = 0
  let len = satisfaction.length
      for (let i = len - 1; i >= 0 && satisfaction[i] > -total; i--) {
    total += satisfaction[i]
    res += total
  }
  return res
}
