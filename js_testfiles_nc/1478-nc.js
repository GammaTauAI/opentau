const updateBoard = function(board, click) {
  const visited = new Set();
  const [clickRow, clickCol] = click;
  if (board[clickRow][clickCol] === "M") {
    board[clickRow][clickCol] = "X";
    return board;
  }
  const directions = [
    [-1, 0],     [1, 0],     [0, -1],     [0, 1],     [-1, -1],     [1, 1],     [-1, 1],     [1, -1]   ];
  function dfs(row, col) {
    visited.add(`${row},${col}`);
    if (board[row][col] === "M") return;
    let numBombs = 0;
    for (let dir of directions) {
      if (
        board[row + dir[0]] === undefined ||
        board[row + dir[0]][col + dir[1]] === undefined
      )
        continue;
      if (board[row + dir[0]][col + dir[1]] === "M") {
        numBombs += 1;
      }
    }
    if (numBombs) {
      board[row][col] = `${numBombs}`;
      return;
    }
    board[row][col] = "B";
    for (let dir of directions) {
      if (
        board[row + dir[0]] === undefined ||
        board[row + dir[0]][col + dir[1]] === undefined ||
        board[row + dir[0]][col + dir[1]] !== "E"
      )
        continue;
      if (!visited.has(`${row + dir[0]},${col + dir[1]}`)) {
        dfs(row + dir[0], col + dir[1]);
      }
    }
  }
  dfs(clickRow, clickCol);
  return board;
};
