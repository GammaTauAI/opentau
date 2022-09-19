const leftMostColumnWithOne = function (binaryMatrix) {
  const [rows, cols] = binaryMatrix.dimensions();
  let candidate = -1;
  for (let r = 0, c = cols - 1; r < rows && c >= 0; ) {
    if (binaryMatrix.get(r, c) === 1) {
      candidate = c;
      c--;
    } else {
      r++;
    }
  }
  return candidate;
};
