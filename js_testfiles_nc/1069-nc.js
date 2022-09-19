const minimumXORSum = function (nums1, nums2) {
  const n = nums1.length, dp = Array(1 << n).fill(Infinity)
  return dfs(0, 0)
  function dfs(i, mask) {
    if(i === n) return 0
    if(dp[mask] !== Infinity) return dp[mask]
    for(let j = 0; j < n; j++) {
      if((mask & (1 << j)) === 0) {
        dp[mask] = Math.min(
          dp[mask], 
          (nums1[i] ^ nums2[j]) + dfs(i + 1, mask | (1 << j))
        )
      }
    }
    return dp[mask]
  }
}
const minimumXORSum = function(nums1, nums2) {
  const dp = Array(1 << nums2.length).fill(Infinity)
  return dfs(dp, nums1, nums2, 0, 0)
};
function dfs(dp, a, b, i, mask) {
  if(i >= a.length) return 0
  if(dp[mask] === Infinity) {
    for(let j = 0; j < b.length; j++) {
      if((mask & (1 << j)) === 0) {
        dp[mask] = Math.min(dp[mask], (a[i] ^ b[j]) + dfs(dp, a, b, i + 1, mask + (1 << j)))
      }
    }
  }
  return dp[mask]
}
const minimumXORSum = function (nums1, nums2) {
  const dp = Array(1 << nums2.length).fill(Infinity)
  return dfs(0, 0)
  function dfs(i, mask) {
    if(i >= nums2.length) return 0
    if(dp[mask] != Infinity) return dp[mask]
    for(let j = 0; j < nums2.length; j++) {
      if((mask & (1 << j)) === 0) {
        dp[mask] = Math.min(dp[mask], (nums1[i] ^ nums2[j]) + dfs(i + 1, mask + (1 << j)) )   
      }
    } 
    return dp[mask]
  }
}
const minimumXORSum = function (nums1, nums2) {
  const n = nums1.length, dp = Array(1 << n).fill(Infinity)
  return dfs(0, 0)
  function dfs(i, mask) {
    if(i >= n) return 0
    if(dp[mask] !== Infinity) return dp[mask]
    for(let j = 0; j < n; j++) {
      if((mask & (1 << j)) === 0) {
        dp[mask] = Math.min(dp[mask], (nums1[i] ^ nums2[j]) + dfs(i + 1, mask | (1 << j)))
      }
    }
    return dp[mask]
  }
}
