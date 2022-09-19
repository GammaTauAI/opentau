class Node {
  constructor(key, val) {
    this.val = val;
    this.key = key;
    this.next = this.pre = null;
  }
}
const LRUCache = function(capacity) {
  this.capacity = capacity;
  this.count = 0;
  this.start = new Node(-1, -1);
  this.end = new Node(-1, -1);
  this.start.next = this.end;
  this.end.pre = this.start;
  this.map = {};
};
const insertAfter = function(start, node) {
  let next = start.next;
  start.next = node;
  node.pre = start;
  node.next = next;
  next.pre = node;
};
const detach = function(node) {
  let pre = node.pre,
    next = node.next;
  pre.next = next;
  next.pre = pre;
  node.next = node.pre = null;
};
LRUCache.prototype.get = function(key) {
  let node = this.map[key];
  if (node != undefined) {
    detach(node);
    insertAfter(this.start, node);
    return node.val;
  } else {
    return -1;
  }
};
LRUCache.prototype.put = function(key, value) {
  let node = this.map[key];
  if (!node) {
    if (this.count == this.capacity) {
            let t = this.end.pre;
      detach(t);
      delete this.map[t.key];
    } else {
      this.count++;
    }
    node = new Node(key, value);
    this.map[key] = node;
    insertAfter(this.start, node);
  } else {
    node.val = value;
    detach(node);
    insertAfter(this.start, node);
  }
};
const LRUCache = function(capacity) {
  this.m = new Map()
  this.limit = capacity
};
LRUCache.prototype.get = function(key) {
  if(!this.m.has(key)) return -1
  const v = this.m.get(key)
  this.m.delete(key)
  this.m.set(key, v)
  return v
};
LRUCache.prototype.put = function(key, value) {
  if(this.m.has(key)) {
    this.m.delete(key)
  } else {
    if(this.m.size >= this.limit) {
      const first = this.m.keys().next().value
      this.m.delete(first)
    }
  }
  this.m.set(key, value)
};
