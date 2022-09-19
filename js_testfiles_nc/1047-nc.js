const countComponents = function(n, edges) {
  const nums = Array(n).fill(-1)
  for (let i = 0; i < edges.length; i++) {
    const x = find(nums, edges[i][0])
    const y = find(nums, edges[i][1])
    if (x !== y) nums[x] = y
  }
  return nums.filter(num => num === -1).length
}
const find = (nums, i) => {
  if (nums[i] === -1) return i
  return find(nums, nums[i])
}
