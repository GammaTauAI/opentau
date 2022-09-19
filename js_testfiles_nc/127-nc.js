const MyCalendar = function () {
  this.root = null
}
const Node = function (start, end) {
  this.start = start
  this.end = end
  this.left = null
  this.right = null
}
Node.prototype.insert = function (node) {
  if (node.start >= this.end) {
    if (this.right === null) {
      this.right = node
      return true
    }
    return this.right.insert(node)
  } else if (node.end <= this.start) {
    if (this.left === null) {
      this.left = node
      return true
    }
    return this.left.insert(node)
  } else {
    return false
  }
}
MyCalendar.prototype.book = function (start, end) {
  const newNode = new Node(start, end)
  if (this.root === null) {
    this.root = newNode
    return true
  } else {
    return this.root.insert(newNode)
  }
}
const MyCalendar = function() {
  this.s = new Set()
};
MyCalendar.prototype.book = function(start, end) {
  for(let e of this.s) {
    if(Math.max(start, e[0]) < Math.min(end, e[1])) return false
  }
  this.s.add([start, end])
  return true
};
