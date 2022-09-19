const addTwoNumbers = function(l1, l2) {
  let res = new ListNode(null)
  let inc = false
  let cur = res
  while(l1 || l2 || inc) {
    const tmp = ((l1 && l1.val) || 0) + ((l2 && l2.val) || 0) + (inc ? 1 : 0)
    if(tmp >= 10) inc = true
    else inc = false
    cur.next = new ListNode(tmp % 10)
    cur = cur.next
    if(l1) l1 = l1.next
    if(l2) l2 = l2.next
  }
  return res.next
};
const addTwoNumbers = function(l1, l2) {
  const res = new ListNode(null);
  single(l1, l2, res);
  return res.next;
};
function single(l1, l2, res) {
  let cur;
  let addOne = 0;
  let sum = 0;
  let curVal = 0;
  while (l1 || l2 || addOne) {
    sum = ((l1 && l1.val) || 0) + ((l2 && l2.val) || 0) + addOne;
    if (sum / 10 >= 1) {
      curVal = sum % 10;
      addOne = 1;
    } else {
      curVal = sum;
      addOne = 0;
    }
    if (cur) {
      cur = cur.next = new ListNode(curVal);
    } else {
      cur = res.next = new ListNode(curVal);
    }
    if (l1) {
      l1 = l1.next;
    }
    if (l2) {
      l2 = l2.next;
    }
  }
}
const addTwoNumbers = function(l1, l2) {
  let extra = false
  const dummy = new ListNode()
  let cur = dummy
  while(l1 || l2) {
    let val = 0
    if(l1) val += l1.val
    if(l2) val += l2.val
    if(extra) val += 1
    if(val > 9) {
      extra = true
      val = val % 10
    } else {
      extra = false
    }
    cur.next = new ListNode(val)
    cur = cur.next
    if(l1) l1 = l1.next
    if(l2) l2 = l2.next
  }
  if(extra) cur.next = new ListNode(1)
  return dummy.next
};
