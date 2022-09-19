








const maximumCandies = function(candies, k) {
  let max = candies.reduce((ac, e) => ac + e, 0);
  let min = 0;
  while (min < max) {
    let mid = max - Math.floor((max - min) / 2);
    let cnt = 0;
    for (let cand of candies) {
      cnt += ~~(cand / mid);
    }
    if (cnt < k) {
      max = mid - 1;
    } else {
      min = mid;
    }
  }
  return min;
};

// another






const maximumCandies = function(candies, k) {
  let max = candies.reduce((ac, e) => ac + e, 0)
  let min = 0
  while(min < max) {
    const mid = max - Math.floor((max - min) /2)
    let num = 0
    for(let e of candies) num += ~~(e / mid)
    if(num < k) max = mid - 1
    else min = mid
  }
  return min
};

