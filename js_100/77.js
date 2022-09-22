












const sortTransformedArray = function(nums, a, b, c) {
  const n = nums.length
  const sorted = new Array(n)
  let i = 0,
    j = n - 1
  let index = a >= 0 ? n - 1 : 0
  while (i <= j) {
    if (a >= 0) {
      sorted[index--] =
        quad(nums[i], a, b, c) >= quad(nums[j], a, b, c)
          ? quad(nums[i++], a, b, c)
          : quad(nums[j--], a, b, c)
    } else {
      sorted[index++] =
        quad(nums[i], a, b, c) >= quad(nums[j], a, b, c)
          ? quad(nums[j--], a, b, c)
          : quad(nums[i++], a, b, c)
    }
  }
  return sorted
}

function quad(x, a, b, c) {
  return a * x * x + b * x +c
}

// another








const sortTransformedArray = function(nums, a, b, c) {
  const ret = []
  const sum = v => a * v * v + b * v + c
  if (a > 0) {
    const point = (b / a / 2) * -1
    let i = 0,
      j = nums.length
    while (i < j) {
      let ax = nums[i]
      if (Math.abs(nums[i] - point) - Math.abs(nums[j - 1] - point) > 0) {
        ++i
      } else {
        ax = nums[--j]
      }
      ret.unshift(sum(ax))
    }
    return ret
  } else if (a < 0) {
    const point = (b / a / 2) * -1
    let i = 0,
      j = nums.length
    while (i < j) {
      let ax = nums[i]
      if (Math.abs(ax - point) - Math.abs(nums[j - 1] - point) > 0) {
        ++i
      } else {
        ax = nums[--j]
      }
      ret.push(sum(ax))
    }
    return ret
  } else {
    if (b > 0) {
      return nums.map(v => sum(v))
    } else {
      nums.forEach(v => {
        ret.unshift(sum(v))
      })
      return ret
    }
  }
}


