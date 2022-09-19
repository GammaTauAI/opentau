






const SubrectangleQueries = function(rectangle) {
  this.rect = rectangle
  this.ops = []
};









SubrectangleQueries.prototype.updateSubrectangle = function(row1, col1, row2, col2, newValue) {
  this.ops.push([row1, col1, row2, col2, newValue])
};






SubrectangleQueries.prototype.getValue = function(row, col) {
  for(let i = this.ops.length - 1; i >= 0; i--) {
    const op = this.ops[i]
    if(op[0] <= row && op[1] <= col && row <= op[2] && col <= op[3]) return op[4]
  }
  return this.rect[row][col]
};








