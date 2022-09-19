









const wallsAndGates = function(rooms) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  const rows = rooms.length
  const cols = rows === 0 ? 0 : rooms[0].length
  const q = []
  const INF = 2147483647
  for(let i = 0; i < rows; i++) {
    for(let j = 0; j < cols; j++) {
      if(rooms[i][j] === 0) q.push([i, j])
    }
  }
  while(q.length) {
    const el = q.shift()
    for(let d of dirs) {
      const r = el[0] + d[0]
      const c = el[1] + d[1]
      if(r < 0 || c < 0 || r >= rows || c >= cols || rooms[r][c] !== INF) continue
      rooms[r][c] = rooms[el[0]][el[1]] + 1
      q.push([r, c])
    }
  }
};

// another





const wallsAndGates = function(rooms) {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  const rows = rooms.length;
  const cols = rows === 0 ? 0 : rooms[0].length;
  const q = [];
  const INF = 2147483647;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (rooms[i][j] === 0) dfs(dirs, rooms, i, j, rows, cols, 0);
    }
  }
};

function dfs(dirs, rooms, i, j, rows, cols, dis) {
  if (
    i < 0 ||
    j < 0 ||
    i >= rows ||
    j >= cols ||
    rooms[i][j] === -1 ||
    rooms[i][j] < dis
  ) {
    return;
  }
  rooms[i][j] = dis;
  for (let dir of dirs) {
    dfs(dirs, rooms, i + dir[0], j + dir[1], rows, cols, dis + 1);
  }
}


