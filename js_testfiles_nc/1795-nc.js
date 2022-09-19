const minSwaps = function(s) {
  const stk = []
  for (let e of s) {
    if(e === '[') stk.push(e)
    else {
      if(stk.length) {
        stk.pop()
      } else stk.push(e)
    }
  }
  return Math.ceil(stk.length / 2)
};
const minSwaps = function(s) {
  const stack = []
  let num = 0
  for(let e of s) {
    if(e === '[') {
      stack.push(e)
      num++
    }
    if(e === ']') {
      if(stack[stack.length - 1] === '[') {
        stack.pop()
        num--
      }
    }
  }
    return Math.ceil(num / 2)
};
const minSwaps = function(s) {
  let num = 0
  for(let e of s) {
    if(e === '[') {
      num++
    }
    if(e === ']') {
      if(num > 0) {
        num--
      }
    }
  }
  return Math.ceil(num / 2)
};
