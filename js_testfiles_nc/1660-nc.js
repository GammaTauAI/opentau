const maxSum = function(nums1, nums2) {
  let i = 0, j = 0, n = nums1.length, m = nums2.length;
  let a = 0, b = 0, mod = 10 ** 9 + 7;
  while (i < n || j < m) {
    if (i < n && (j === m || nums1[i] < nums2[j])) {
      a += nums1[i++];
    } else if (j < m && (i === n || nums1[i] > nums2[j])) {
      b += nums2[j++];
    } else {
      a = b = Math.max(a, b) + nums1[i];
      i++; j++;
    }
  }
  return Math.max(a, b) % mod;
};
const maxSum = function(nums1, nums2) {
  const len1 = nums1.length, len2 = nums2.length
  const mod = 10 ** 9 + 7
  const map = new Map()
  for(let i = 0; i < len1 - 1; i++) {
    if(!map.has(nums1[i])) map.set(nums1[i], [])
    map.get(nums1[i]).push(nums1[i + 1])
  }
  for(let j = 0; j < len2 - 1; j++) {
    if(!map.has(nums2[j])) map.set(nums2[j], [])
    map.get(nums2[j]).push(nums2[j + 1])
  }
  const memo = new Map()
  return Math.max(greedy(nums1[0], map, memo), greedy(nums2[0], map, memo)) % mod
};
function greedy(cur, map, memo) {
  if(memo.has(cur)) return memo.get(cur)
  if(!map.has(cur)) return cur
  let res = 0
  for(let next of map.get(cur)) {
    const tmp = greedy(next, map, memo)
    if(tmp > res) res = tmp
  }
  res += cur
  memo.set(cur, res)
  return res
}
