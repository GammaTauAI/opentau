








const cleanRoom = function(robot) {
  const visited = new Set()
  const shift = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1]
  ]
  dfs(0, 0, 0)
  function dfs(r, c, dir) {
    visited.add(r + ',' + c)
    robot.clean()
    for (let i = 0; i < 4; i++) {
      const newDir = (dir + i) % 4
      const x = shift[newDir][0] + r
      const y = shift[newDir][1] + c
      if (!visited.has(x + ',' + y) && robot.move()) {
        dfs(x, y, newDir)
        robot.turnRight()
        robot.turnRight()
        robot.move()
        robot.turnRight()
        robot.turnRight()
      }
      robot.turnRight()
    }
  }
}

// another





const cleanRoom = function(robot) {
  const dirs = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1]
  ]
  const visited = new Set()
  clean(0, 0, 0)
  function clean( x, y, curDirection) {
    robot.clean()
    visited.add(`${x},${y}`)
    for(let i = curDirection; i < curDirection + 4; i++) {
      const nx = dirs[i % 4][0] + x
      const ny = dirs[i % 4][1] + y
      if(!visited.has(`${nx},${ny}`) && robot.move()) {
        clean(nx, ny, i % 4)
      }
      robot.turnRight()
    }
    robot.turnRight()
    robot.turnRight()
    robot.move()
    robot.turnRight()
    robot.turnRight()
    
  }
};


