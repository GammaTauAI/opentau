const maximumRequests = function(n, requests) {
  const arr = Array(n).fill(0)
  let res = 0
  bt(requests, 0, arr, 0)
  return res
  function bt(r, idx, arr, num) {
    if(idx === r.length) {
      for(let i = 0; i < n; i++) {
        if(arr[i] !== 0) return
      }
      res = Math.max(res, num)
      return
    }
    const [from, to] = r[idx]
    arr[from]++
    arr[to]--
    bt(r, idx + 1, arr, num + 1)
    arr[from]--
    arr[to]++
    bt(r, idx + 1, arr, num)
  }
};
const maximumRequests = function (n, requests) {
  let max = 0
  helper(requests, 0, Array(n).fill(0), 0)
  return max
  function helper(requests, index, count, num) {
        if (index === requests.length) {
      for (let i of count) {
        if (0 !== i) {
          return
        }
      }
      max = Math.max(max, num)
      return
    }
        count[requests[index][0]]++
    count[requests[index][1]]--
    helper(requests, index + 1, count, num + 1)
    count[requests[index][0]]--
    count[requests[index][1]]++
        helper(requests, index + 1, count, num)
  }
}
