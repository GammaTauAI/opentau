var amountOfTime = function(root, start) {
  const graph = new Map()
  dfs(root)
    const visited = new Set([start])
  let q = [start]
  let res = 0
  while(q.length) {
    const tmp = []
    const size = q.length
        for(let i = 0; i < size; i++) {
      const cur = q[i]
      for(const nxt of (graph.get(cur) || [])) {
        if(visited.has(nxt)) continue
        tmp.push(nxt)
        visited.add(nxt)
      }
    }
    q = tmp
    res++
  }
  return res - 1
  function dfs(node) {
    if(node == null) return
    if(node.left) {
      if(!graph.has(node.left.val)) graph.set(node.left.val, new Set())
      if(!graph.has(node.val)) graph.set(node.val, new Set())
      graph.get(node.val).add(node.left.val)
      graph.get(node.left.val).add(node.val)
      dfs(node.left)
    }
    if(node.right) {
      if(!graph.has(node.right.val)) graph.set(node.right.val, new Set())
      if(!graph.has(node.val)) graph.set(node.val, new Set())
      graph.get(node.val).add(node.right.val)
      graph.get(node.right.val).add(node.val)
      dfs(node.right)
    }
  }
};
