const LFUCache = function(capacity) {
  this.min = -1;
  this.capacity = capacity;
  this.keyToVal = {};
  this.keyToCount = {};
  this.countToLRUKeys = {};
};
LFUCache.prototype.get = function(key) {
  if (!this.keyToVal.hasOwnProperty(key)) return -1;
  let count = this.keyToCount[key];
  let idx = this.countToLRUKeys[count].indexOf(key);
  if (idx !== -1) this.countToLRUKeys[count].splice(idx, 1);
  if (count === this.min && this.countToLRUKeys[count].length === 0) this.min++;
  putCount(key, count + 1, this.keyToCount, this.countToLRUKeys);
  return this.keyToVal[key];
};
LFUCache.prototype.put = function(key, value) {
  if (this.capacity <= 0) return;
  if (this.keyToVal.hasOwnProperty(key)) {
    this.keyToVal[key] = value;     this.get(key);     return;
  }
  if (Object.keys(this.keyToVal).length >= this.capacity) {
    evict(
      this.countToLRUKeys[this.min][0],
      this.min,
      this.keyToVal,
      this.countToLRUKeys
    );   }
  this.min = 1;
  putCount(key, this.min, this.keyToCount, this.countToLRUKeys);   this.keyToVal[key] = value; };
function evict(key, min, keyToVal, countToLRUKeys) {
  let idx = countToLRUKeys[min].indexOf(key);
  if (idx !== -1) countToLRUKeys[min].splice(idx, 1);
  delete keyToVal[key];
}
function putCount(key, count, keyToCount, countToLRUKeys) {
  keyToCount[key] = count;
  if (countToLRUKeys.hasOwnProperty(count)) {
    countToLRUKeys[count].push(key);
  } else {
    countToLRUKeys[count] = [key];
  }
}
