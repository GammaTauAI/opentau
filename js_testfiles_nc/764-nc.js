const Solution = function(radius, x_center, y_center) {
  this.radius = radius
  this.x_center = x_center
  this.y_center = y_center
}
Solution.prototype.randPoint = function() {
  let len = Math.sqrt(Math.random()) * this.radius
  let deg = Math.random() * 2 * Math.PI
  let x = this.x_center + len * Math.cos(deg)
  let y = this.y_center + len * Math.sin(deg)
  return [x, y]
}
