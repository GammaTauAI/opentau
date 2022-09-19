const rotateGrid = function (grid, k) {
  const m = grid.length,
    n = grid[0].length;
  let top = 0,
    left = 0,
    right = n - 1,
    bottom = m - 1;
  while (top < bottom && left < right) {
    const num = (right - left + 1) * 2 + (bottom - top + 1) * 2 - 4;
    let rem = k % num;
    while (rem) {
      const tmp = grid[top][left];
      for (let i = left; i < right; i++) {
        grid[top][i] = grid[top][i + 1];
      }
      for (let i = top; i < bottom; i++) {
        grid[i][right] = grid[i + 1][right];
      }
      for (let i = right; i > left; i--) {
        grid[bottom][i] = grid[bottom][i - 1];
      }
      for (let i = bottom; i > top; i--) {
        grid[i][left] = grid[i - 1][left];
      }
      grid[top + 1][left] = tmp;
      rem--;
    }
    left++;
    top++;
    right--;
    bottom--;
  }
  return grid;
};
var rotateGrid = function (grid, k) {
  var m = grid.length;
  var n = grid[0].length;
  var layer = Math.min(n / 2, m / 2);
  for (l = 0; l < layer; l++) {
    var cur = [];
    for (var j = l; j < n - l; j++) {
      cur.push(grid[l][j]);
    }
    for (var i = l + 1; i < m - l; i++) {
      cur.push(grid[i][n - l - 1]);
    }
    for (var j = n - l - 2; j >= l; j--) {
      cur.push(grid[m - l - 1][j]);
    }
    for (var i = m - l - 2; i > l; i--) {
      cur.push(grid[i][l]);
    }
    var d = cur.length;
    var offset = k % d;
    cur = [...cur.slice(offset, d), ...cur.slice(0, offset)];
    var index = 0;
    for (var j = l; j < n - l; j++) {
      grid[l][j] = cur[index++];
    }
    for (var i = l + 1; i < m - l; i++) {
      grid[i][n - l - 1] = cur[index++];
    }
    for (var j = n - l - 2; j >= l; j--) {
      grid[m - l - 1][j] = cur[index++];
    }
    for (var i = m - l - 2; i > l; i--) {
      grid[i][l] = cur[index++];
    }
  }
  return grid;
};
