const pourWater = function (heights, V, K) {
  if (!V) return heights
  let bottom = K
    for (let i = K; i >= 0; i--) {
    if (heights[i] > heights[bottom]) break
    if (heights[i] < heights[bottom]) bottom = i
  }
      if (bottom !== K) {
    heights[bottom]++
    return pourWater(heights, V - 1, K)
  }
  for (let i = K + 1; i < heights.length; i++) {
    if (heights[i] > heights[bottom]) break
    if (heights[i] < heights[bottom]) bottom = i
  }
  heights[bottom]++
  return pourWater(heights, V - 1, K)
}
const pourWater = function (heights, V, K) {
  let cur = K
  for (let i = 0; i < V; i++) {
        while (cur > 0 && heights[cur - 1] <= heights[cur]) {
      cur--
    }
        while (cur < heights.length - 1 && heights[cur + 1] <= heights[cur]) {
      cur++
    }
        while(cur > K && heights[cur - 1] === heights[cur]) {
      cur--
    }
    heights[cur]++
  }
  return heights
}
