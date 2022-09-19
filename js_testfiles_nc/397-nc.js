const increasingTriplet = function(nums) {
        let small = Number.MAX_VALUE, big = Number.MAX_VALUE;
    for (let n of nums) {
        if (n <= small) { small = n; }         else if (n <= big) { big = n; }         else return true;     }
    return false;
};
const increasingTriplet = function(nums) {
  const n = nums.length, stk = []
  for(let e of nums) {
    let l = 0, r = stk.length
    while(l < r) {
      const mid = l + Math.floor((r - l) / 2)
      if (e > stk[mid]) l = mid + 1
      else r = mid 
    }
    stk[l] = e
    if(stk.length > 2) return true
  }
  return false
};
