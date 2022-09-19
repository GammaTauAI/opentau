const numberOfPatterns = function(m, n) {
    const skip = Array.from({ length: 10 }, () => new Array(10).fill(0))
  skip[1][3] = skip[3][1] = 2
  skip[1][7] = skip[7][1] = 4
  skip[3][9] = skip[9][3] = 6
  skip[7][9] = skip[9][7] = 8
  skip[1][9] = skip[9][1] = skip[2][8] = skip[8][2] = skip[3][7] = skip[7][3] = skip[4][6] = skip[6][4] = 5
  const vis = new Array(10).fill(false)
  let rst = 0
    for (let i = m; i <= n; ++i) {
    rst += DFS(vis, skip, 1, i - 1) * 4     rst += DFS(vis, skip, 2, i - 1) * 4     rst += DFS(vis, skip, 5, i - 1)   }
  return rst
}
function DFS(vis, skip, cur, remain) {
  if (remain < 0) return 0
  if (remain === 0) return 1
  vis[cur] = true
  let rst = 0
  for (let i = 1; i <= 9; ++i) {
        if (!vis[i] && (skip[cur][i] === 0 || vis[skip[cur][i]])) {
      rst += DFS(vis, skip, i, remain - 1)
    }
  }
  vis[cur] = false
  return rst
}
const numberOfPatterns = function (m, n) {
  const skip = Array.from({ length: 10 }, () => Array(10).fill(0))
  let res = 0
  skip[1][3] = skip[3][1] = 2
  skip[1][7] = skip[7][1] = 4
  skip[9][7] = skip[7][9] = 8
  skip[9][3] = skip[3][9] = 6
  skip[1][9] = skip[9][1] = skip[2][8] = skip[8][2] = skip[3][7] = skip[7][3] = skip[4][6] = skip[6][4] = 5
  const visited = new Set()
  for(let i = m ;i <= n; i++) {
    res += dfs(1, i - 1) * 4     res += dfs(2, i - 1) * 4     res += dfs(5, i - 1)   }
  return res
  function dfs(cur, remain) {
    if(remain === 0) return 1
    let res = 0
    visited.add(cur)
    for(let i = 1; i <= 9; i++) {
      if(!visited.has(i) && (skip[cur][i] === 0 || visited.has(skip[cur][i]))) {
        res += dfs(i, remain - 1)
      }
    }
    visited.delete(cur)
    return res
  }
}
