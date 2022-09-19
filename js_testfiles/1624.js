








const depthSum = function(nestedList) {
  return h(nestedList, 1)
};

function h(arr, level) {
  if(arr == null || arr.length === 0) return 0
  let sum = 0
  for(let i = 0, len = arr.length; i < len; i++) {
    if(arr[i].isInteger()) sum += arr[i].getInteger() * level
    else {
      sum += h(arr[i].getList(), level + 1)
    }
  }
  return sum
}

// another

const depthSum = function(nestedList) {
  if(nestedList == null) return 0
  let sum = 0
  let level = 1
  const q = [...nestedList]
  while(q.length) {
    const len = q.length
    for(let i = 0; i < len; i++) {
      const el = q.shift()
      if(el.isInteger()) sum += el.getInteger() * level
      else q.push(...(el.getList()))
    }
    level++
  }
  return sum
};

