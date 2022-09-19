const TwoSum = function() {
  this.hm = new Map();
};
TwoSum.prototype.add = function(number) {
  this.hm.set(number, (this.hm.get(number) || 0) + 1);
};
TwoSum.prototype.find = function(value) {
  for (let item of this.hm) {
    let target = value - item[0];
    if (this.hm.has(target)) {
      if (target !== item[0] || this.hm.get(target) > 1) return true;
    }
  }
  return false;
};
