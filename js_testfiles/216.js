











const hasPath = function(maze, start, destination) {
  const m = maze.length
  const n = maze[0].length
  const queue = []
  const visited = Array.from({ length: m }, () => new Array(n).fill(false))
  queue.push(start)
  const dirs = [
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, 0]
  ]
  while (queue.length) {
    const cur = queue.shift()
    if (cur[0] === destination[0] && cur[1] === destination[1]) return true
    if (visited[cur[0]][cur[1]]) continue
    visited[cur[0]][cur[1]] = true
    for (let dir of dirs) {
      let x = cur[0],
        y = cur[1]
      while (x >= 0 && x < m && y >= 0 && y < n && maze[x][y] === 0) {
        x += dir[0]
        y += dir[1]
      }
      x -= dir[0]
      y -= dir[1]
      queue.push([x, y])
    }
  }
  return false
}

// another







const hasPath = function(maze, start, destination) {
  const visited = Array.from({ length: maze.length }, () =>
    new Array(maze[0].length).fill(false)
  )
  const dirs = [
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, 0]
  ]
  return dfs(maze, start, destination, visited, dirs)
}

function dfs(maze, start, destination, visited, dirs) {
  if (visited[start[0]][start[1]]) return false
  if (start[0] === destination[0] && start[1] === destination[1]) return true
  visited[start[0]][start[1]] = true
  for (let i = 0; i < dirs.length; i++) {
    const d = dirs[i]
    let row = start[0]
    let col = start[1]
    while (isValid(maze, row + d[0], col + d[1])) {
      row += d[0]
      col += d[1]
    }
    if (dfs(maze, [row, col], destination, visited, dirs)) return true
  }
  return false
}

function isValid(maze, row, col) {
  return (
    row >= 0 &&
    row < maze.length &&
    col >= 0 &&
    col < maze[0].length &&
    maze[row][col] !== 1
  )
}

// another







const hasPath = function(maze, start, destination) {
  const m = maze.length, n = maze[0].length
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  const visited = new Set()
  let res = false
  dfs(start[0], start[1])
  return res
  
  function dfs(i, j) {
    if(i < 0 || i >= m || j < 0 || j >= n || maze[i][j] === 1 || visited.has(`${i},${j}`)) return
    if(i === destination[0] && j === destination[1]) {
      res = true
      return
    }
    visited.add(`${i},${j}`)
    const ib = i, jb = j
    for(const [dx, dy] of dirs) {
      let ii = i, jj = j
      while(
        ii + dx >= 0 &&
        ii + dx < m &&
        jj + dy >= 0 &&
        jj + dy < n &&
        maze[ii + dx][jj + dy] === 0
      ) {
          ii += dx
          jj += dy
      }
      dfs(ii, jj)
    }
  }
};

// another







const hasPath = function(maze, start, destination) {
  const m = maze.length, n = maze[0].length
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  const visited = new Set()
  const q = [start]
  while(q.length) {
    const [i, j] = q.pop()
    if(i === destination[0] && j === destination[1]) return true
    visited.add(`${i},${j}`)
    for(const [dx, dy] of dirs) {
      let ni = i, nj = j
      while(valid(ni + dx, nj + dy)) {
        ni += dx
        nj += dy
      }
      if(!visited.has(`${ni},${nj}`)) q.push([ni, nj])
    }
  }
  
  return false
  
  function valid(i, j) {
    return i >= 0 && i < m && j >= 0 && j < n && maze[i][j] === 0
  }
};

