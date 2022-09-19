









const numDistinctIslands = function(grid) {
  const set = new Set()
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (grid[i][j] === 1) {
        const tempArr = []
        helper(i, j, grid, tempArr)
        const x = tempArr[0][0] - 0
        const y = tempArr[0][1] - 0
        let str = ''
        for (let k = 0; k < tempArr.length; k++) {
          str += '#' + (tempArr[k][0] - x) + '#' + (tempArr[k][1] - y)
        }
        set.add(str)
      }
    }
  }
  return set.size
}

function helper(i, j, arr, tempArr) {
  tempArr.push([i, j])
  arr[i][j] = 0

  if (arr[i][j - 1] === 1) helper(i, j - 1, arr, tempArr)
  if (arr[i][j + 1] === 1) helper(i, j + 1, arr, tempArr)
  if (arr[i - 1]) {
    if (arr[i - 1][j] === 1) helper(i - 1, j, arr, tempArr)
  }
  if (arr[i + 1]) {
    if (arr[i + 1][j] === 1) helper(i + 1, j, arr, tempArr)
  }
}

// another





const numDistinctIslands = function(grid) {
  if (!grid.length) return 0;
  const pattern = new Set();
  grid.forEach((rows, row) => {
    rows.forEach((val, col) => {
      if (val === 1) pattern.add(depthFirst(grid, row, col, "o"));
    });
  });
  return pattern.size;
};

function depthFirst(graph, row, col, di) {
  if (graph[row] && graph[row][col]) {
    graph[row][col] = 0;
    let p =
      di +
      depthFirst(graph, row + 1, col, "d") +
      depthFirst(graph, row - 1, col, "u") +
      depthFirst(graph, row, col + 1, "r") +
      depthFirst(graph, row, col - 1, "l") +
      "b";
    return p;
  } else return "";
}

