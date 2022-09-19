






const Bitset = function (size) {
  this.arr = Array.from({ length: 2 }, (el, idx) =>
    Array(size).fill(idx === 0 ? 0 : 1)
  )
  this.cur = 0
  this.cnt = 0
}





Bitset.prototype.fix = function (idx) {
  if(this.arr[this.cur][idx] === 1) return
  this.arr[this.cur][idx] = 1
  this.arr[this.cur ^ 1][idx] = 0
  this.cnt++
}





Bitset.prototype.unfix = function (idx) {
  if(this.arr[this.cur][idx] === 0) return
  this.arr[this.cur][idx] = 0
  this.arr[this.cur ^ 1][idx] = 1
  this.cnt--
}




Bitset.prototype.flip = function () {
  this.cur ^= 1
  this.cnt = this.arr[this.cur].length - this.cnt
}




Bitset.prototype.all = function () {
  return this.cnt === this.arr[this.cur].length
}




Bitset.prototype.one = function () {
  return this.cnt > 0
}




Bitset.prototype.count = function () {
  return this.cnt
}




Bitset.prototype.toString = function () {
  return this.arr[this.cur].join('')
}




// another




var Bitset = function(size) {
  this.s = Array.from({ length:2 }, () => Array())
  this.cnt = 0
  this.now = 0
  for (let i = 0; i < size; i++) {
    this.s[this.now].push( '0');
    this.s[this.now ^ 1].push( '1');
  }
};





Bitset.prototype.fix = function(idx) {
    if (this.s[this.now][idx] == '1') return;
    // swap(this.s[this.now][idx], this.s[this.now ^ 1][idx]);
    const tmp = this.s[this.now][idx]
    this.s[this.now][idx] = this.s[this.now ^ 1][idx]
    this.s[this.now ^ 1][idx] = tmp
    this.cnt++;
};





Bitset.prototype.unfix = function(idx) {
    if (this.s[this.now][idx] == '0') return;
    // swap(this.s[this.now][idx], this.s[this.now ^ 1][idx]);
    const tmp = this.s[this.now][idx]
    this.s[this.now][idx] =  this.s[this.now ^ 1][idx]
   this.s[this.now ^ 1][idx] = tmp
    this.cnt--;
};




Bitset.prototype.flip = function() {
    this.now = this.now ^ 1;
    this.cnt = this.s[0].length - this.cnt;
};




Bitset.prototype.all = function() {
    return this.cnt == this.s[0].length;
};




Bitset.prototype.one = function() {
    return this.cnt !== 0
};




Bitset.prototype.count = function() {
    return this.cnt;
};




Bitset.prototype.toString = function() {
     return this.s[this.now].join('');
};






