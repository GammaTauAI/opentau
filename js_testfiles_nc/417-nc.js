var minMalwareSpread = function (graph, initial) {
  const map = new Map()   for (let i of initial) {
    const visited = new Set(initial)
    const q = []
    q.push(i)
    while (q.length) {
      let cur = q.shift()
      for (let j = 0; j < graph[cur].length; j++) {
        if (graph[cur][j] == 1) {
          if (!visited.has(j)) {
            visited.add(j)
            q.push(j)
            if (map.get(j) == null) map.set(j, [])
            map.get(j).push(i)
          }
        }
      }
    }
  }
  const res = Array(graph.length).fill(0)   for (let node of map.keys()) {
    if (map.get(node).length == 1) {
      let i = map.get(node)[0]
      res[i]++
    }
  }
  let max = 0
  let removed = -1
  for (let i = 0; i < res.length; i++) {
    if (res[i] > max) {
      max = res[i]
      removed = i
    }
  }
  initial.sort((a, b) => a - b)
  return removed == -1 ? initial[0] : removed
}
const minMalwareSpread = function (graph, initial) {
  const map = new Map(), n = graph.length
  for(let init of initial) {
    const visited = new Set(initial)
    const q = [init]
    while(q.length) {
      const cur = q.pop()
      for(let i = 0; i < n; i++) {
        if(graph[cur][i] === 1 && !visited.has(i)) {
          visited.add(i)
          q.push(i)
          if(map.get(i) == null) map.set(i, [])
          map.get(i).push(init)
        }
      }      
    }
  }
  let res = 0, max = -1
  const arr = Array(n)
  for(let [k,v] of map) {
    if(v.length === 1) {
      if(arr[v[0]] == null) arr[v[0]] = 0
      arr[v[0]]++
    }
  }
  for(let k = 0; k < n; k++) {
    const v = arr[k]
    if(v > max) {
      max = v
      res = +k
    }
  }
  let min = Infinity
  for(let e of initial) {
    if(e < min) min = e
  }
  return max === -1 ? min: res
}
