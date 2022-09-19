const validTicTacToe = function(board) {
  if (board.length == 0) return false
    let turns = 0
    let xWin = isGameOver(board, 'X')
  let oWin = isGameOver(board, 'O')
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      if (board[i].charAt(j) == 'X') turns++
      else if (board[i].charAt(j) == 'O') turns--
    }
  }
  if (turns < 0 || turns > 1 || (turns == 0 && xWin) || (turns == 1 && oWin))
    return false
  return true
}
function isGameOver(board, player) {
    for (let i = 0; i < 3; i++) {
    if (
      board[i].charAt(0) === player &&
      board[i].charAt(0) === board[i].charAt(1) &&
      board[i].charAt(1) === board[i].charAt(2)
    ) {
      return true
    }
  }
    for (let j = 0; j < 3; j++) {
    if (
      board[0].charAt(j) == player &&
      board[0].charAt(j) == board[1].charAt(j) &&
      board[1].charAt(j) == board[2].charAt(j)
    ) {
      return true
    }
  }
    if (
    board[1].charAt(1) == player &&
    ((board[0].charAt(0) == board[1].charAt(1) &&
      board[1].charAt(1) == board[2].charAt(2)) ||
      (board[0].charAt(2) == board[1].charAt(1) &&
        board[1].charAt(1) == board[2].charAt(0)))
  ) {
    return true
  }
  return false
}
