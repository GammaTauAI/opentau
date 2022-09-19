








const minMalwareSpread = function (graph, initial) {
  const l = graph.length
  const p = []
  const children = []
  for (let i = 0; i < l; i++) {
    p[i] = i
    children[i] = [i]
  }

  for (let i = 0; i < l; i++) {
    for (let j = i + 1; j < l; j++) {
      if (graph[i][j] === 1) {
        const pi = find(i)
        const pj = find(j)
        if (pi !== pj) {
          union(pi, pj)
        }
      }
    }
  }

  initial.sort((a, b) => (a > b ? 1 : -1))

  const count = {}

  let index = initial[0]
  let max = 0
  // find the index that not unioned with other indexes and with the most number of children
  initial.forEach((e) => {
    const pe = find(e)
    if (!count[pe]) count[pe] = 0
    count[pe] += 1
  })
  initial.forEach((e, i) => {
    const pe = find(e)
    if (count[pe] === 1 && children[pe].length > max) {
      max = children[pe].length
      index = e
    }
  })

  return index

  function find(x) {
    while (p[x] !== x) {
      p[x] = p[p[x]]
      x = p[x]
    }
    return x
  }

  function union(pi, pj) {
    p[pj] = pi
    //also move the children to the new parent
    children[pi] = children[pi].concat(children[pj])
    children[pj] = []
  }
}

