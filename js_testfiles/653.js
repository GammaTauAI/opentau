






const TimeMap = function() {
   this.hash = {}
};







TimeMap.prototype.set = function(key, value, timestamp) {
  if(this.hash[key] == null) this.hash[key] = []
  this.hash[key].push([value, timestamp])
};






TimeMap.prototype.get = function(key, timestamp) {
  if(this.hash[key] == null) return ''
  const arr = this.hash[key]

  let l = 0, r = arr.length - 1;
  while(l <= r) {
    const pick = Math.floor((l + r) / 2);
    if (arr[pick][1] < timestamp) {
        l = pick + 1;
    } else if (arr[pick][1] > timestamp) {
        r = pick - 1
    } else {
        return arr[pick][0];
    }
  }
  return arr[r]?.[0] || ''
};








// another




const TimeMap = function() {
   this.hash = {}
};







TimeMap.prototype.set = function(key, value, timestamp) {
  if(this.hash[key] == null) this.hash[key] = []
  this.hash[key].push([value, timestamp])
};






TimeMap.prototype.get = function(key, timestamp) {
  if(this.hash[key] == null) return ''
  const arr = this.hash[key]

  let l = 0, r = arr.length
  while(l < r) {
    const mid = l + ((r - l) >> 1)
    if(arr[mid][1] <= timestamp) {
      l = mid + 1
    } else {
      r = mid
    }
  }

  if(r === 0) return ''
  return arr[r - 1][0]
};








