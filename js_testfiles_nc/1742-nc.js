const findMaximizedCapital = function(k, W, Profits, Capital) {
  const capPQ = new PriorityQueue((a, b) => a.cap < b.cap)
  const proPQ = new PriorityQueue((a, b) => a.pro > b.pro)
  for(let i = 0, len = Profits.length; i < len; i++) {
    capPQ.push({ cap: Capital[i], pro: Profits[i] })
  }
  while(k) {
    while(!capPQ.isEmpty() && capPQ.peek().cap <= W) {
      proPQ.push(capPQ.pop())
    }
    if(proPQ.isEmpty()) break
    W += proPQ.pop().pro
    k--
  }
  return W
};
class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this.heap = []
    this.top = 0
    this.comparator = comparator
  }
  size() {
    return this.heap.length
  }
  isEmpty() {
    return this.size() === 0
  }
  peek() {
    return this.heap[this.top]
  }
  push(...values) {
    values.forEach((value) => {
      this.heap.push(value)
      this.siftUp()
    })
    return this.size()
  }
  pop() {
    const poppedValue = this.peek()
    const bottom = this.size() - 1
    if (bottom > this.top) {
      this.swap(this.top, bottom)
    }
    this.heap.pop()
    this.siftDown()
    return poppedValue
  }
  replace(value) {
    const replacedValue = this.peek()
    this.heap[this.top] = value
    this.siftDown()
    return replacedValue
  }
  parent = (i) => ((i + 1) >>> 1) - 1
  left = (i) => (i << 1) + 1
  right = (i) => (i + 1) << 1
  greater = (i, j) => this.comparator(this.heap[i], this.heap[j])
  swap = (i, j) => ([this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]])
  siftUp = () => {
    let node = this.size() - 1
    while (node > this.top && this.greater(node, this.parent(node))) {
      this.swap(node, this.parent(node))
      node = this.parent(node)
    }
  }
  siftDown = () => {
    let node = this.top
    while (
      (this.left(node) < this.size() && this.greater(this.left(node), node)) ||
      (this.right(node) < this.size() && this.greater(this.right(node), node))
    ) {
      let maxChild =
        this.right(node) < this.size() &&
        this.greater(this.right(node), this.left(node))
          ? this.right(node)
          : this.left(node)
      this.swap(node, maxChild)
      node = maxChild
    }
  }
}
const findMaximizedCapital = function(k, W, Profits, Capital) {
  const idxArr = Profits.map((_, i) => i).sort((ia, ib) => Profits[ib] - Profits[ia]);
  while (k) {
    const choose = idxArr.findIndex(i => Capital[i] <= W);
    if (choose == -1) return W;
    W += Profits[idxArr[choose]];
    idxArr.splice(choose, 1);
    k--;
  }
  return W;
};
