const reverseKGroup = function(head, k) {
  let n = 0
  for (let i = head; i != null; n++, i = i.next);
  let dmy = new ListNode(0)
  dmy.next = head
  for (let prev = dmy, tail = head; n >= k; n -= k) {
    for (let i = 1; i < k; i++) {
      let next = tail.next.next
      tail.next.next = prev.next
      prev.next = tail.next
      tail.next = next
    }
    prev = tail
    tail = tail.next
  }
  return dmy.next
}
const reverseKGroup = function (head, k) {
  if(head == null) return head
  const dummy = new ListNode()
  dummy.next = head
  let n = 0, cur = head
  while(cur) {
    n++
    cur = cur.next
  }
  if(n < k) return head
  let pre = dummy, tail = head
  for(let i = 0; i + k <= n; i += k) {
    for(let j = 1; j < k; j++) {
      const tmp = pre.next
      pre.next = tail.next
      tail.next = tail.next.next
      pre.next.next = tmp
    }
    pre = tail
    tail = tail.next
  } 
  return dummy.next
}
const reverseKGroup = function (head, k) {
  let ptr = head
  let ktail = null
    let new_head = null
    while (ptr != null) {
    let count = 0
        ptr = head
        while (count < k && ptr != null) {
      ptr = ptr.next
      count += 1
    }
        if (count == k) {
            let revHead = reverseLinkedList(head, k)
            if (new_head == null) new_head = revHead
                  if (ktail != null) ktail.next = revHead
      ktail = head
      head = ptr
    }
  }
    if (ktail != null) ktail.next = head
  return new_head == null ? head : new_head
}
function reverseLinkedList(head, k) {
        let new_head = null
  let ptr = head
  while (k > 0) {
            let next_node = ptr.next
            ptr.next = new_head
    new_head = ptr
        ptr = next_node
        k--
  }
    return new_head
}
