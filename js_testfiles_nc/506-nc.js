const minMoves = function (nums, limit) {
  const { min, max } = Math
  const n = nums.length
  const delta = Array(limit * 2 + 2).fill(0)
  for (let i = 0; i < n / 2; i++) {
    const lo = 1 + min(nums[i], nums[n - i - 1])
    const hi = limit + max(nums[i], nums[n - i - 1])
    const sum = nums[i] + nums[n - i - 1]
    delta[lo]--
    delta[sum]--
    delta[sum + 1]++
    delta[hi + 1]++
  }
  let now = n
  let ans = n
  for (let i = 2; i <= limit * 2; i++) {
    now += delta[i]
    ans = min(ans, now)
  }
  return ans
}
const minMoves = function (nums, limit) {
  const n = nums.length, { max, min } = Math
  const delta = Array(2 * limit + 2).fill(0)
  for(let i = 0; i < n / 2; i++) {
    const a = nums[i], b = nums[n - 1 - i]
        delta[2] += 2
        delta[min(a, b) + 1] -= 1
    delta[a + b]--
        delta[a + b + 1] += 1
        delta[max(a, b) + limit + 1] +=1
  }
  let res = n, cur = 0
  for(let i = 2; i <= limit * 2; i++) {
    cur += delta[i]
    res = min(cur, res)
  }
  return res
}
const minMoves = function (nums, limit) {
  const n = nums.length, { min, max } = Math
  const arr = Array(2 * limit + 2).fill(0)
  for(let i = 0, r = n / 2; i < r; i++) {
    const a = nums[i], b = nums[n - 1 - i]
    arr[2] += 2
    arr[min(a, b) + 1]--
    arr[a + b]--
    arr[a + b + 1]++
    arr[max(a, b) + limit + 1]++
  }
  let res = Infinity, cur = 0
  for(let i = 2, r = 2 * limit; i <= r; i++) {
    cur += arr[i]
    res = min(res, cur)
  }
  return res
}
const minMoves = function (nums, limit) {
  const n = nums.length, { min, max } = Math
  const arr = Array(2 * limit + 2).fill(0)
  for(let i = 0, r = n / 2; i < r; i++) {
    const a = nums[i], b = nums[n - 1 - i]
        arr[2] += 2
    arr[2 * limit + 1] -= 2
        arr[min(a, b) + 1]--
    arr[max(a, b) + limit + 1]++
        arr[a + b]--
    arr[a + b + 1]++
  }
  let res = Infinity, cur = 0
  for(let i = 2, r = 2 * limit; i <= r; i++) {
    cur += arr[i]
    res = min(res, cur)
  }
  return res
}
