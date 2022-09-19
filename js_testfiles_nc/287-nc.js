const buildWall = function (height, width, bricks) {
  const MOD = 1e9 + 7
  const rowPerms = new Set()   const memo = []
  for (let i = 0; i <= height; ++i) {
    memo[i] = new Array(2 ** 10).fill(0)
  }
  findAllPossRowPerms(rowPerms, 0, 0 | 0)
  return countWaysToBuildSturdyWall(height, 0)
  function countWaysToBuildSturdyWall(currHeight, prevRowPerm) {
    if (currHeight === 0) return 1
    if (memo[currHeight][prevRowPerm] != 0) {
      return memo[currHeight][prevRowPerm]
    }
    let totCount = 0
    for (const rowPerm of rowPerms) {
      if ((rowPerm & prevRowPerm) === 0) {
        totCount =
          (totCount + countWaysToBuildSturdyWall(currHeight - 1, rowPerm)) % MOD
      }
    }
    memo[currHeight][prevRowPerm] = totCount
    return totCount
  }
  function findAllPossRowPerms(rowPerms, currWidth, mask) {
    if (currWidth === width) {
      rowPerms.add(mask)
      return
    }
                if (currWidth > 0) mask |= 1 << currWidth
    for (const brick of bricks) {
      if (currWidth + brick <= width) {
        findAllPossRowPerms(rowPerms, currWidth + brick, mask)
      }
    }
    return
  }
}
