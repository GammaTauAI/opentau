









const getModifiedArray = function(length, updates) {
  const res = new Array(length).fill(0)
  for (let update of updates) {
    const [start, end, value] = update
    res[start] += value
    if (end < length - 1) res[end + 1] -= value
  }
  let sum = 0
  for (let i = 0; i < length; i++) {
    sum += res[i]
    res[i] = sum
  }
  return res
}

