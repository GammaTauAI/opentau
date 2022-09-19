const find = (cals, time, count) => {
  let l = 0
  let r = cals.length
  let mid
  while (l < r) {
    mid = Math.trunc((l + r) / 2)
    if (cals[mid][0] === time) {
      cals[mid][1] += count
      return
    } else if (cals[mid][0] < time) {
      l = mid + 1
    } else {
      r = mid
    }
  }
  cals.splice(l, 0, [time, count])
}
const MyCalendarThree = function() {
  this.cals = []
}
MyCalendarThree.prototype.book = function(start, end) {
  let idx = find(this.cals, start, 1)
  idx = find(this.cals, end, -1)
  let count = 0
  let max = 0
  for (let cal of this.cals) {
    count += cal[1]
    max = Math.max(max, count)
  }
  return max
}
var MyCalendarThree = function() {
    this.st = new SegmentTree(0, 10 ** 9);
};
MyCalendarThree.prototype.book = function(start, end) {
    this.st.add(start, end);    
    return this.st.getMax();
};
class SegmentTree {
    constructor(start, end) {
        this.root = new TreeNode(start, end);
    }
    add(qs, qe, node=this.root) {
                if(qs > node.end || qe <= node.start) {
            return node.val;
        }
                if(qs <= node.start && qe > node.end) {
            node.booked += 1;
            node.val += 1;
            return node.val;
        }
        let mid = (node.start + node.end)/2 >> 0;
        if(!node.left) {
            node.left = new TreeNode(node.start, mid);
        }
        if(!node.right) {
            node.right = new TreeNode(mid+1, node.end);
        }
        node.val = Math.max(
            this.add(qs, qe, node.left),
            this.add(qs, qe, node.right),
        ) + node.booked;
        return node.val;
    }
    getMax() {
        return this.root.val;
    }
}
class TreeNode {
    constructor(start, end) {
        this.start = start;
        this.end = end;
        this.val = 0;
        this.booked = 0;
        this.left = this.right = null;
    }
}
