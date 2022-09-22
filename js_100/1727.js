






const MapSum = function() {
  this.hash = {};
};






MapSum.prototype.insert = function(key, val) {
  this.hash[key] = val;
};





MapSum.prototype.sum = function(prefix) {
  let res = 0;
  Object.keys(this.hash).forEach(el => {
    if (el.indexOf(prefix) === 0) {
      res += this.hash[el];
    }
  });
  return res;
};








