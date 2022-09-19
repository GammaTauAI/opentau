const Solution = function(head) {
  this.list = head;
  this.arr = [];
  loop(head, this.arr);
};
Solution.prototype.getRandom = function() {
  const len = this.arr.length;
  return this.arr[Math.floor(Math.random() * len)].val;
};
function loop(node, arr) {
  if (node == null) return;
  arr.push(node);
  loop(node.next, arr);
}
