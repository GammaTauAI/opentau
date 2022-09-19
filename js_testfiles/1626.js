








 const largestPathValue = function(colors, edges) {
  const graph = {}, n = colors.length, a = 'a'.charCodeAt(0)
  const indegree = Array(n).fill(0)
  for (const [from, to] of edges) {
    if (graph[from] == null) graph[from] = []
    graph[from].push(to)
    indegree[to]++
  }
  const cnt = Array.from({ length: n }, () => Array(26).fill(0))
  const code = idx => colors.charCodeAt(idx) - a
  const q = []
  for (let i = 0; i < n; i++) {
    if(indegree[i] === 0) {
      q.push(i)
      cnt[i][code(i)] = 1
    }
  }
  let res = 0, seen = 0

  while(q.length) {
    const u = q.pop()
    const val = cnt[u][code(u)]
    res = Math.max(res, val)
    seen++
    for(const next of (graph[u] || [])) {
      for(let i = 0; i < 26; i++) {
        cnt[next][i] = Math.max(cnt[next][i], cnt[u][i] + (i === code(next) ? 1 : 0))
      }
      if(--indegree[next] === 0) {
        q.push(next)
      }
    }
  }
  return seen < n ? -1 : res
};

// another







const largestPathValue = function (colors, edges) {
  const graph = {}
  const n = colors.length,
    a = 'a'.charCodeAt(0)
  const indegree = Array(colors.length).fill(0)
  for (let e of edges) {
    if (graph[e[0]] == null) graph[e[0]] = []
    graph[e[0]].push(e[1])
    indegree[e[1]]++
  }
  const cnt = Array.from({ length: n }, () => Array(26).fill(0))
  const q = []
  for (let i = 0; i < n; i++) {
    if (indegree[i] === 0) {
      q.push(i)
      cnt[i][colors.charCodeAt(i) - a] = 1
    }
  }
  let res = 0,
    seen = 0
  while (q.length) {
    const u = q[0]
    q.shift()
    const val = Math.max(...cnt[u])
    res = Math.max(res, val)
    seen++
    if (graph[u] == null) continue
    for (let v of graph[u]) {
      for (let i = 0; i < 26; i++) {
        cnt[v][i] = Math.max(
          cnt[v][i],
          cnt[u][i] + (i === colors.charCodeAt(v) - a)
        )
      }
      if (--indegree[v] === 0) q.push(v)
    }
  }
  return seen < colors.length ? -1 : res
}

