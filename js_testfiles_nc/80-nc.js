const minTotalDistance = function(grid) {
  const m = grid.length
  if(!m) return 0
  const n = grid[0].length
  const I = []
  const J = []
  for(let i = 0; i < m; i++) {
    for(let j = 0; j < n; j++) {
      if(grid[i][j] === 1) I.push(i)
    }
  }
  for(let j = 0; j < n; j++) {
    for(let i = 0; i < m; i++) {
      if(grid[i][j] === 1) J.push(j)
    }
  }
  return min(I) + min(J)
};
function min(arr) {
  let i = 0, j = arr.length - 1, sum = 0
  while(i < j) {
    sum += arr[j--] - arr[i++]
  }
  return sum
}
