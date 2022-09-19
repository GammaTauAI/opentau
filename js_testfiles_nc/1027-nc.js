class UF {
  constructor(N) {
    this.parent = []
    this.size = []
    this.max = 1
    for (let i = 0; i < N; i++) {
      this.parent[i] = i
      this.size[i] = 1
    }
  }
  find(x) {
    if (x === this.parent[x]) {
      return x
    }
    return (this.parent[x] = this.find(this.parent[x]))
  }
  union(x, y) {
    let rootX = this.find(x)
    let rootY = this.find(y)
    if (rootX != rootY) {
      this.parent[rootX] = rootY
      this.size[rootY] += this.size[rootX]
      this.max = Math.max(this.max, this.size[rootY])
    }
  }
}
const largestComponentSize = A => {
  let N = A.length
  const map = {}   const uf = new UF(N)
  for (let i = 0; i < N; i++) {
    let a = A[i]
    for (let j = 2; j * j <= a; j++) {
      if (a % j == 0) {
        if (!map.hasOwnProperty(j)) {
                    map[j] = i
        } else {
                    uf.union(i, map[j])
        }
        if (!map.hasOwnProperty(a / j)) {
          map[a / j] = i
        } else {
          uf.union(i, map[a / j])
        }
      }
    }
    if (!map.hasOwnProperty(a)) {
            map[a] = i
    } else {
      uf.union(i, map[a])
    }
  }
  return uf.max
}
