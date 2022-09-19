const maxHappyGroups = function (batchSize, groups) {
  const arr = new Array(batchSize + 1).fill(0)
  let result = 0
    for (let gSize of groups) {
    arr[gSize % batchSize]++
  }
    result += arr[0]
  arr[0] = 0
    for (let i = 1; i < batchSize / 2; i++) {
    let min = Math.min(arr[i], arr[batchSize - i])
    arr[i] -= min
    arr[batchSize - i] -= min
    result += min
  }
  result += dfs(arr, 0, new Map())
  return result
}
function dfs(arr, remain, cache) {
  let n = arr.length - 1
  const key = arr.join(',')
  if (cache.has(key)) return cache.get(key)
  let result = 0
    if (remain > 0 && arr[n - remain] > 0) {
    arr[n - remain]--
    result = dfs(arr, 0, cache)
    arr[n - remain]++
  } else {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > 0) {
        arr[i]--
        result = Math.max(
          result,
          dfs(arr, (remain + i) % n, cache) + (remain == 0 ? 1 : 0)
        )
        arr[i]++
      }
    }
  }
  cache.set(key, result)
  return result
}
