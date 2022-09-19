const oddEvenJumps = function (A) {
    let sorted = A.map((el, idx) => idx).sort((a, b) => A[a] - A[b] || a - b)
    let oddJumps = new Array(A.length).fill(-1)
  let evenJumps = new Array(A.length).fill(-1)
    let stack = []
    for (let i of sorted) {
        while (stack.length && i > stack[stack.length - 1]) {
            oddJumps[stack.pop()] = i
    }
        stack.push(i)
  }
    stack = []
    let reverseSorted = sorted.sort((a, b) => A[b] - A[a] || a - b)
    for (let i of reverseSorted) {
    while (stack.length && i > stack[stack.length - 1]) {
      evenJumps[stack.pop()] = i
    }
    stack.push(i)
  }
    let count = 1
    let oddEnd = new Array(A.length).fill(false)
  let evenEnd = new Array(A.length).fill(false)
    oddEnd[A.length - 1] = true
  evenEnd[A.length - 1] = true
    for (let i = A.length - 2; i >= 0; --i) {
        if (evenJumps[i] !== -1 && oddEnd[evenJumps[i]]) evenEnd[i] = true
    if (oddJumps[i] !== -1 && evenEnd[oddJumps[i]]) {
      oddEnd[i] = true
      count++
    }
  }
  return count
}
