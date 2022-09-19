const mergeInBetween = function(list1, a, b, list2) {
  const dummy = new ListNode()
  dummy.next = list1
  let cur = dummy
  let tail
  let idx = -1
  while(cur) {
    if(cur.next && idx + 1 === a) {
      tail = cur
      const tmp = cur.next
      cur.next = null
      cur = tmp
      idx++
      break
    }
    cur = cur.next
    idx++
  }
  let head
    while(cur) {
    if(idx === b) {
      head = cur.next
      cur.next = null
      break
    }
    cur = cur.next
    idx++
  }
  tail.next = list2
  cur = list2
  while(cur) {
    if(cur.next == null) {
      cur.next = head
      break
    }
    cur = cur.next
  }
  return dummy.next
};
