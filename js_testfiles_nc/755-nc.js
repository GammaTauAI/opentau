const singleNumber = function(nums) {
    const hash = {}
    nums.forEach(el => {
      hash[el] = (hash[el] && hash[el] + 1) || 1
    })
    for(let el in hash) {
      if(hash[el] === 1) return +el
    }
};
const singleNumber = (nums)=> {
  let one=0, two=0;
  for (let i=0; i<nums.length; i++) {
    one = (one ^ nums[i]) & ~two;
    two = (two ^ nums[i]) & ~one;
  }
  return one;
}
const singleNumber = (nums)=> {
        let result = 0;
    let x, sum;
    const n = nums.length
        for (let i = 0; i < 32; i++) {
                  sum = 0;
      x = (1 << i);
      for (let j = 0; j < n; j++ ) {
          if (nums[j] & x) sum++;
      }
                  if (sum % 3) result |= x;
    }
    return result;
}
