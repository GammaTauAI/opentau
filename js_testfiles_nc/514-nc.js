const reverseBetween = function(head, left, right) {
  if(head == null) return head
  const dummy = new ListNode(null, head)
  let num = 0, cur = head
  while (cur) {
    num++
    cur = cur.next
  }
  let idx = 0, pre = null
  cur = dummy
  while (idx < right && idx <= num) {
    if (idx === left - 1) pre = cur
    if (idx >= left) {
      const tmp = pre.next
      pre.next = cur.next
      cur.next = cur.next.next
      pre.next.next = tmp
    }
    if (idx < left) cur = cur.next
    idx++
  }
  return dummy.next
};
const reverseBetween = function(head, m, n) {
        if (head == null) {
        return null;
    }
            let cur = head, prev = null;
    while (m > 1) {
        prev = cur;
        cur = cur.next;
        m--;
        n--;
    }
        let con = prev, tail = cur;
        let third = null;
    while (n > 0) {
        third = cur.next;
        cur.next = prev;
        prev = cur;
        cur = third;
        n--;
    }
        if (con != null) {
        con.next = prev;
    } else {
        head = prev;
    }
    tail.next = cur;
    return head;
};
const reverseBetween = function(head, m, n) {
    if (!head) return null;
    const dummy = new ListNode(0);
    dummy.next = head;
    let pre = dummy;
    for (let i = 0; i < m-1; i++) pre = pre.next
    let start = pre.next;
    let then = start.next;
    for (let i = 0; i < n-m; i++) {
        start.next = then.next
        then.next = pre.next
        pre.next = then;
        then = start.next;
    }
    return dummy.next;
};
const reverseBetween = function(head, left, right) {
  if(head == null || left === right) return head
  const dummy = new ListNode()
  dummy.next = head
  let tail = null, p = dummy
  for(let i = 1; i < left; i++) {
    p = p.next
  } 
  tail = p.next
  let tmp
  for(let i = 0; i < right - left; i++) {
    tmp = p.next
    p.next = tail.next
    tail.next = tail.next.next
    p.next.next = tmp
  }
  return dummy.next
};
const reverseBetween = function(head, left, right) {
  if(head == null) return head
  if(left === right) return head
  let cur = head, prev = null
  let step = 1
  while(step !== left) {
    prev = cur
    cur = cur.next
    step++
  }
  let l = cur
  while(step !== right) {
    cur = cur.next
    step++
  }
  let r = cur, next = cur.next
    let start = l, p = null
  while(start !== r) {
    let n = start.next
    start.next = p
    p = start
    start = n
  }
  r.next = p
  l.next = next
  if(prev) prev.next = r
  return prev ? head : r
};
const reverseBetween = function(head, left, right) {
  if(head == null) return head
  const dummy = new ListNode()
  dummy.next = head
  let p = dummy
  for(let i = 0; i < left - 1; i++) {
    p = p.next
  }
  let tail = p.next, tmp = null
  for(let i = 0; i < right - left; i++) {
    tmp = p.next
    p.next = tail.next
    tail.next = tail.next.next
    p.next.next = tmp
  }
  return dummy.next
};
