const removeElements = function(head, val) {
  const dummy = new ListNode(Infinity)
  if(head == null) return null
  dummy.next = head
  let cur = head
  let prev = dummy
  while(cur) {
    if(cur.val === val) {
      prev.next = cur.next
      cur = cur.next
    } else {
      prev = cur
      cur = cur.next
    }
  }
  return dummy.next
};
const removeElements = function(head, val) {
  if (head === null) return null;
  head.next = removeElements(head.next, val);
  return head.val === val ? head.next : head;
};
