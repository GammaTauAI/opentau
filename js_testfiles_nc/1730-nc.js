const minimumTotal = function(triangle) {
  const n = triangle.length;
  for (let i = n - 2; i >= 0; i--) {
    for (let j = 0; j < n; j++) {
      let self = triangle[i][j];       let res = Math.min(
        triangle[i + 1][j] + self,
        triangle[i + 1][j + 1] + self
      );       triangle[i][j] = res;     }
  }
  return triangle[0][0];
};
