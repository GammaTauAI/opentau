const reverse = function (x) {
  let res = 0, tail, newResult
  const low = -Math.pow(2, 31), high = Math.pow(2, 31)
  while(x !== 0) {
    tail = x % 10
    newResult = res * 10 + tail
        if(newResult < low || newResult >= high) return 0
    res = newResult
    x = ~~(x / 10)
  }
  return res
};
const reverse = function(num) {
  let negative = false;
  let result = 0;
  if (num < 0) {
    negative = true;
    num = Math.abs(num);
  }
  while (num > 0) {
    mod = num % 10;     num = Math.floor(num / 10);     result = result * 10 + mod;   }
  if (result > 2147483647) return 0;
  if (negative) return result * -1;
  return result;
};
