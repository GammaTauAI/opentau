








const smallestChair = function (times, targetFriend) {
  const targetArrival = times[targetFriend][0]
  let seatNum = 0
  let res = 0
  const n = times.length
  
  times.sort((a, b) => a[0] - b[0])
  
  const occupied = new PriorityQueue((a, b) => a[0] < b[0])
  const available = new PriorityQueue((a, b) => a < b)
  
  for(let i = 0; i < n; i++) {
    const [arrival, leaving] = times[i]
    while(!occupied.isEmpty() && occupied.peek()[0] <= arrival) {
      available.push(occupied.pop()[1])      
    }
    let seat
    if(!available.isEmpty()) {
      seat = available.pop()
    } else {
      seat = seatNum
      seatNum++
    }
    occupied.push([leaving, seat])
    if(arrival === targetArrival) {
      res = seat
      break
    }
  }
  
  return res
}
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

// another







var smallestChair = function (times, targetFriend) {
  const [targetArrival] = times[targetFriend]
  const arrivalQueue = times
  const leavingQueue = [...times]
  arrivalQueue.sort((a, b) => a[0] - b[0])
  leavingQueue.sort((a, b) => a[1] - b[1] || a[0] - b[0])
  const chairsByLeaveTime = new Map()
  let chairsCount = 0
  let arriving = 0,
    leaving = 0

  while (arriving < arrivalQueue.length) {
    let chairIdx
    const arrival = arrivalQueue[arriving][0]
    const leave = leavingQueue[leaving][1]
    if (arrival < leave) {
      chairIdx = chairsCount++
    } else {
      let freeChairIdx = leaving
      chairIdx = chairsByLeaveTime.get(leavingQueue[freeChairIdx++][0])
      while (arrival >= leavingQueue[freeChairIdx][1]) {
        const nextChair = chairsByLeaveTime.get(leavingQueue[freeChairIdx][0])
        if (chairIdx > nextChair) {
          ;[leavingQueue[leaving], leavingQueue[freeChairIdx]] = [
            leavingQueue[freeChairIdx],
            leavingQueue[leaving],
          ]
          chairIdx = nextChair
        }
        ++freeChairIdx
      }
      ++leaving
    }
    if (targetArrival === arrival) {
      return chairIdx
    }
    chairsByLeaveTime.set(arrival, chairIdx)
    arriving++
  }
}

