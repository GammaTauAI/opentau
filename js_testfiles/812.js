








function doable(nums, cuts, max) {
    let acc = 0
    for(let num of nums) {
        if(num > max) return false
        else if(acc + num <= max) acc += num
        else {
            --cuts;
            acc = num;
            if(cuts < 0) return false
        }
    }
    return true
}


function splitArray(nums, m) {
    let left = 0
    let right = 0
    for(let num of nums) {
        left = Math.max(left, num)
        right += num
    }
    while(left < right) {
        let mid = Math.floor(left + (right - left) / 2)
        if(doable(nums, m - 1, mid)) right = mid
        else left = mid + 1 
    }
    return left
}







const splitArray = function(nums, m) {
  let l = 0,
    r = 0
  for (let el of nums) {
    if (el > l) l = el
    r += el
  }
  while (l < r) {
    let mid = Math.floor((l + r) / 2)
    if (numOfSubArrLessOrEqualThanM(nums, mid, m)) r = mid
     else l = mid + 1
  }
  return l
}

function numOfSubArrLessOrEqualThanM(nums, target, m) {
  let sum = 0,
    count = 1
  for (let el of nums) {
    sum += el
    if (sum > target) {
      sum = el
      count++
    }
    if (count > m) return false
  }
  return true
}





// another






const splitArray = (nums, m) => {
  let max = -Infinity, sum = 0
  for(let num of nums) {
    sum += num
    max = Math.max(max, num)
  }
  if (m === 1) return sum
  let l = max, r = sum
  while(l < r) {
    let mid = l + ((r - l) >> 1)
    if(valid(mid, nums, m)) {
      r = mid
    } else {
      l = mid + 1
    }
  }
  return l
}

function valid(target, nums, m) {
  let cnt = 1, sum = 0
  for(let num of nums) {
    sum += num
    if(sum > target) {
      cnt++
      sum = num
      if(cnt > m) return false
    }
  }

  return true
}

