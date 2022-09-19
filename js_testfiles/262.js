






const Solution = function(w) {
  this.a = []
  let sum = 0
  for (let i = 0, len = w.length; i < len; i++) {
    sum += w[i]
    this.a[i] = sum
  }
}




Solution.prototype.pickIndex = function() {
  const len = this.a.length
  const sum = this.a[len - 1]
  const rand = ((Math.random() * sum) >> 0) + 1
  let l = 0,
    h = len - 1
  while (l < h) {
    const mid = (l + h) >> 1
    if (this.a[mid] === rand) return mid
    else if (this.a[mid] < rand) l = mid + 1
    else h = mid
  }
  return l
}







// another




const Solution = function(w) {
  this.a = []
  let sum = 0
  for(let i = 0, len = w.length; i < len; i++) {
    sum += w[i]
    this.a[i] = sum
  }
};




Solution.prototype.pickIndex = function() {
  const len = this.a.length
  const sum = this.a[len - 1]
  const rand = ((Math.random() * sum) >> 0) + 1
  let l = 0, h = len - 1
  while(l <= h) {
    const mid = (l + h) >> 1
    if(this.a[mid] === rand) return mid
    else if(this.a[mid] < rand) l = mid + 1
    else h = mid - 1
  }
  return l
};







// another




const Solution = function(w) {
  this.a = []
  let sum = 0
  for(let i = 0, len = w.length; i < len; i++) {
    sum += w[i]
    this.a[i] = sum
  }
};




Solution.prototype.pickIndex = function() {
  const len = this.a.length
  const sum = this.a[len - 1]
  const rand = ((Math.random() * sum) >> 0) + 1
  let l = 0, h = len - 1
  while(l < h) {
    const mid = (l + h) >> 1
    if(this.a[mid] < rand) l = mid + 1
    else h = mid
  }
  return l
};







