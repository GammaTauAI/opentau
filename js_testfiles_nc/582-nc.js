const TextEditor = function () {
  this.stk1 = []
  this.stk2 = []
}
TextEditor.prototype.addText = function (text) {
  for (const ch of text) this.stk1.push(ch)
}
TextEditor.prototype.deleteText = function (k) {
  let res = 0
  while (this.stk1.length && k) {
    k--
    res++
    this.stk1.pop()
  }
  return res
}
TextEditor.prototype.cursorLeft = function (k) {
  let res = ''
  while (this.stk1.length && k) {
    const tmp = this.stk1.pop()
    this.stk2.push(tmp)
    k--
  }
  return this.slice()
}
TextEditor.prototype.cursorRight = function (k) {
  let res = ''
  while (this.stk2.length && k) {
    const tmp = this.stk2.pop()
    this.stk1.push(tmp)
    k--
  }
  return this.slice()
}
TextEditor.prototype.slice = function() {
  let res = ''
  for (
    let len = this.stk1.length, size = Math.min(10, this.stk1.length), i = 0;
    i < size;
    i++
  ) {
    res = this.stk1[len - i - 1] + res
  }
  return res
}
class Node {
  constructor(val) {
    this.val = val
    this.prev = null
    this.next = null
  }
}
var TextEditor = function() {
 this.left = []
 this.right = []
 this.idx = 0
};
TextEditor.prototype.addText = function(text) {
 for(const ch of text) this.left.push(ch)
};
TextEditor.prototype.deleteText = function(k) {
  let res = 0
  while(this.left.length && k) {
    res++
    this.left.pop()
    k--
  }
  return res
};
TextEditor.prototype.cursorLeft = function(k) {
  while(k && this.left.length) {
  const tmp = this.left.pop()
  this.right.push(tmp)
    k--
  }
  return this.left.slice(Math.max(0, this.left.length - 10), this.left.length).join('')
};
TextEditor.prototype.cursorRight = function(k) {
  while(k && this.right.length) {
  const tmp = this.right.pop()
  this.left.push(tmp)  
    k--
  }
  return this.left.slice(Math.max(0, this.left.length - 10), this.left.length).join('')
};
