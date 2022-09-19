function largestIsland(grid) {
  const map = new Map()   map.set(0, 0)   let n = grid.length
  let colorIndex = 2   for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] == 1) {
        let size = paint(grid, i, j, colorIndex)
        map.set(colorIndex, size)
        colorIndex++
      }
    }
  }
      let res = map.get(2) || 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 0) {
                const set = new Set()
                set.add(i > 0 ? grid[i - 1][j] : 0)
        set.add(i < n - 1 ? grid[i + 1][j] : 0)
        set.add(j > 0 ? grid[i][j - 1] : 0)
        set.add(j < n - 1 ? grid[i][j + 1] : 0)
        let newSize = 1         for (let color of set) newSize += map.get(color)
        res = Math.max(res, newSize)
      }
    }
  }
  return res
}
function paint(grid, i, j, color) {
  if (i < 0 || j < 0 || i >= grid.length || j >= grid[0].length || grid[i][j] != 1) return 0
  grid[i][j] = color
  return (
    1 +
    paint(grid, i + 1, j, color) +
    paint(grid, i - 1, j, color) +
    paint(grid, i, j + 1, color) +
    paint(grid, i, j - 1, color)
  )
}
