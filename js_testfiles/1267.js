











const shortestDistance = function(maze, start, destination) {
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, 1],
    [0, -1]
  ]
  if (maze == null || maze.length === 0 || maze[0].length === 0) return -1
  const m = maze.length
  const n = maze[0].length
  const d = Array.from({ length: m }, () => new Array(n).fill(Infinity))
  const q = [[start[0], start[1], 0]]

  while (q.length) {
    const cur = q.shift()
    for (let dir of dirs) {
      let nextX = cur[0]
      let nextY = cur[1]
      let len = cur[2]
      while (
        nextX >= 0 &&
        nextX < m &&
        nextY >= 0 &&
        nextY < n &&
        maze[nextX][nextY] === 0
      ) {
        nextX += dir[0]
        nextY += dir[1]
        len++
      }
      nextX -= dir[0]
      nextY -= dir[1]
      len--
      if (len > d[destination[0]][destination[1]]) continue
      if (len < d[nextX][nextY]) {
        d[nextX][nextY] = len
        q.push([nextX, nextY, len])
      }
    }
  }
  return d[destination[0]][destination[1]] === Infinity
    ? -1
    : d[destination[0]][destination[1]]
}

