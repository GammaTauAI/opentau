const minOperations = function(nums) {
  const N = nums.length;
  if(N === 1) return 0;
  nums.sort((a, b) => a - b)
  let M = 1;
  for(let i = 1; i < N; i++) {
    if(nums[i] != nums[i-1]) nums[M++] = nums[i];
  }
  let j = 0;
  let res = N;
  for(let i = 0; i < M; i++) {
        while(j < M && nums[j] <= N + nums[i] - 1) j++;
            res = Math.min(res, N - (j - i));
  }
  return res;
};
