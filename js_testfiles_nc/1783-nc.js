const minimumSemesters = function (N, relations) {
  const g = new Map()   const inDegree = new Array(N + 1).fill(0)   for (let r of relations) {
    if (!g.has(r[0])) g.set(r[0], [])
    g.get(r[0]).push(r[1])     ++inDegree[r[1]]   }
  const q = []   for (let i = 1; i <= N; ++i) if (inDegree[i] === 0) q.push(i)
  let semester = 0
  while (q.length) {
        for (let sz = q.length; sz > 0; --sz) {
            const c = q.shift()
      --N
            if (!g.has(c)) continue
      const tmp = g.get(c)
      g.delete(c)
      for (let course of tmp)
        if (--inDegree[course] === 0)
                    q.push(course)     }
    ++semester   }
  return N === 0 ? semester : -1
}
