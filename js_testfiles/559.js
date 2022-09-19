




const SnakeGame = function(width, height, food) {
  this.width = width
  this.height = height
  this.food = food
  this.foodIdx = 0
  this.row = 0
  this.col = 0
  this.queue = [0]
  this.visited = new Set([0])
}









SnakeGame.prototype.move = function(direction) {
  if (direction === 'U') {
    this.row--
  }
  if (direction === 'R') {
    this.col++
  }
  if (direction === 'D') {
    this.row++
  }
  if (direction === 'L') {
    this.col--
  }
  const head = this.row * this.width + this.col

  // in the next move, head can be the previous tail, so check head !== this.queue[0]
  if (head !== this.queue[0] && this.visited.has(head)) {
    return -1
  }

  if (
    this.row >= 0 &&
    this.row < this.height &&
    this.col >= 0 &&
    this.col < this.width
  ) {
    // check if can eat food
    if (
      this.foodIdx < this.food.length &&
      this.food[this.foodIdx][0] === this.row &&
      this.food[this.foodIdx][1] === this.col
    ) {
      this.foodIdx++
    } else {
      this.visited.delete(this.queue[0])
      this.queue.shift()
    }

    this.queue.push(head)
    this.visited.add(head)
    return this.foodIdx
  }
  return -1
}







