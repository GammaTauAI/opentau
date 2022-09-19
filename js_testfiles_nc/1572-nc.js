const removeKdigits = function(num, k) {
  const digits = num.length - k;
  const stk = new Array(num.length);
  let top = 0;
          for (let i = 0; i < num.length; i++) {
    let c = num.charAt(i);
    while (top > 0 && stk[top - 1] > c && k > 0) {
      top -= 1;
      k -= 1;
    }
    stk[top++] = c;
  }
    let idx = 0;
  while (idx < digits && stk[idx] === "0") idx++;
  return idx === digits ? "0" : stk.slice(idx, digits + idx).join("");
};
const removeKdigits = function(num, k) {
  const n = num.length, stack = []
  if(n === k) return '0'
  let i = 0
  while(i < n) {
    while(k > 0 && stack.length && stack[stack.length - 1] > num[i]) {
      k--
      stack.pop()
    }
    stack.push(num[i++])
  }
  while(k-- > 0) stack.pop()
  while(stack[0] === '0') stack.shift()
  return stack.length ? stack.join('') : '0'
};
const removeKdigits = function(num, k) {
  const n = num.length, stack = []
  for(let i = 0; i < n; i++) {
    const ch = num[i]
    while(stack.length && k > 0 && ch < stack[stack.length - 1]) {
      stack.pop()
      k--
    }
    stack.push(ch)
  }
  while(k > 0) {
    stack.pop()
    k--
  }
  while(stack[0] === '0') stack.shift()
  return stack.length ? stack.join('') : '0'
};
