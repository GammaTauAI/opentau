







const TicTacToe = function(n) {
  this.n = n
  this.cols = new Array(n).fill(0)
  this.rows = new Array(n).fill(0)
  this.diagonal = 0
  this.antiDiagonal = 0
}



TicTacToe.prototype.move = function(row, col, player) {
  const { n } = this
  const toAdd = player === 1 ? 1 : -1
  this.rows[row] += toAdd
  this.cols[col] += toAdd
  if (row === col) {
    this.diagonal += toAdd
  }
  if (col === n - row - 1) {
    this.antiDiagonal += toAdd
  }
  if (
    Math.abs(this.rows[row]) === n ||
    Math.abs(this.cols[col]) === n ||
    Math.abs(this.diagonal) === n ||
    Math.abs(this.antiDiagonal) === n
  ) {
    return player
  }
  return 0
}







