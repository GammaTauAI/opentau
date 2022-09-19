














const sortLinkedList = function(head) {
  if(head == null) return head
  const dummy = new ListNode(null, head)
  let pre = dummy, cur = head
  while(cur) {
    if(cur.val < 0 && cur !== head) {
      const tmp = cur.next, tmpHead = dummy.next
      dummy.next = cur
      cur.next = tmpHead
      pre.next = tmp
      cur = tmp
    } else {
      pre = cur
      cur = cur.next
    }
  }

  return dummy.next
};

