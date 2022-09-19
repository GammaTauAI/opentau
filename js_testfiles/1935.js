









const highFive = function(items) {
  const m = {}
  for(let el of items) {
    const key = '' + el[0]
    if(!m.hasOwnProperty(key)) m[key] = []
    add(m[key], el[1])
  }
  const res = []
  Object.entries(m).forEach(el => {
    res.push([+el[0], div(el[1])])
  })
  return res.sort((a, b) => a[0] - b[0])
};

function div(arr) {
  let sum = 0
  arr.forEach(el => sum += el)
  return sum / 5 >> 0
}

function add(arr, val) {
  if(arr.length < 5) arr.push(val)
  else {
    let min = Number.MAX_VALUE
    let idx = -1
    for(let i = 0, len = arr.length; i < len; i++) {
      if(arr[i] < min) {
        min = arr[i]
        idx = i
      }
    }
    if(val > min && idx !== -1) {
      arr.splice(idx, 1, val)
    }
  }
}

