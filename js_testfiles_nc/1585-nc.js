const smallestTrimmedNumbers = function(nums, queries) {
  const m = nums.length, n = queries.length, len = nums[0].length
  const res = []
  for(const [k, trim] of queries) {
    const tmp = nums.map(e => e.slice(trim>len?0:len - trim))
        const clone = tmp.slice().map((e,i) => ({v:e,i}))
    clone.sort((a, b) => {
      a = BigInt(a.v)
      b = BigInt(b.v)
      if(a > b) {
        return 1;
      } else if (a < b){
        return -1;
      } else {
        return 0;
      }
    })
        const el = clone[k - 1]
        res.push(el.i)
  }
  return res
};
