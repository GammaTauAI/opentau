const SnapshotArray = function(length) {
  this.snaps = Array(length)
  this.snapId = 0
};
SnapshotArray.prototype.set = function(index, val) {
  if(this.snaps[index] == null) {
    this.snaps[index] = {}
  }
  this.snaps[index][this.snapId] = val
};
SnapshotArray.prototype.snap = function() {
  return this.snapId++
};
SnapshotArray.prototype.get = function(index, snap_id) {
  let res = 0
  let id = snap_id
  while(id >= 0) {
    if(this.snaps[index] == null || this.snaps[index][id] == null) id--
    else {
      res = this.snaps[index][id]
      break
    }
  }
  return res
};
const binarySearch = function (nums, target, comparator) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    let mid = low + ((high - low) >>> 1);
    let midValue = nums[mid];
    let cmp = comparator(midValue, target);
    if (cmp < 0) low = mid + 1;
    else if (cmp > 0) high = mid - 1;
    else return mid;
  }
  return -(low + 1);
};
const SnapshotArray = function (length) {
  this.count = 0;
  this.arr = Array.from({ length: length }, () => [[0, 0]]);
};
SnapshotArray.prototype.set = function (index, val) {
  const arr = this.arr,
    count = this.count;
  if (arr[index][arr[index].length - 1][0] === count) {
    arr[index][arr[index].length - 1][1] = val;
  } else {
    arr[index].push([count, val]);
  }
};
SnapshotArray.prototype.snap = function () {
  return this.count++;
};
SnapshotArray.prototype.get = function (index, snap_id) {
  let idx = binarySearch(this.arr[index], [snap_id, 0], (a, b) => a[0] - b[0]);
  if (idx < 0) idx = -idx - 2;
  return this.arr[index][idx][1];
};
const SnapshotArray = function(length) {
  this.arr = new Array(length).fill(0);
  this.snaps = new Array(length);
  this.count = 0;
};
SnapshotArray.prototype.set = function(index, val) {
  if (this.snaps[index] == undefined) {
    this.snaps[index] = {};
  }
  this.snaps[index][this.count] = val;
};
SnapshotArray.prototype.snap = function() {
  return this.count++;
};
SnapshotArray.prototype.get = function(index, snap_id) {
  if (this.snaps[index] == undefined) return 0;
  let res = 0;
  while (snap_id >= 0) {
    if (this.snaps[index][snap_id] == undefined) {
      snap_id--;
    } else {
      res = this.snaps[index][snap_id];
      snap_id = -1;
    }
  }
  return res;
};
