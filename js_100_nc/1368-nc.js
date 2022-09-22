const NumArray = function(nums) {
    this.arr = nums
};
NumArray.prototype.update = function(i, val) {
    this.arr[i] = val
};
NumArray.prototype.sumRange = function(i, j) {
    let sum = 0;
    for (let k = i; k <= j; k++) {
        sum += this.arr[k];
    }
    return sum;
};
