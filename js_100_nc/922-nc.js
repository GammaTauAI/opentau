const isPowerOfTwo = function(n) {
    let tmp = 0
    let idx = 0
    while(tmp <= n) {
          if((tmp = Math.pow(2, idx)) === n) {
              return true
          } else {
              idx += 1
          }
    }
    return false
};
const isPowerOfTwo = function(n) {
    return Math.log2(n)%1 === 0
};
const isPowerOfTwo = n => n < 1 ? false : Number.MAX_VALUE % n === 0
const isPowerOfTwo = x => x > 0 ? !(x & (x - 1)) : false;
