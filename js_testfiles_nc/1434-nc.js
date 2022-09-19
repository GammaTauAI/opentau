const swapPairs = function(node) {
  const head = new ListNode(-1);
  let cur = head;
  while (node !== null) {
    if (node.next !== null) {
      let one = node;
      let two = node.next;
      let three = node.next.next;
      cur.next = two;
      two.next = one;
      one.next = three;
      cur = cur.next.next;
      node = three;
    } else {
      cur.next = node;
      break;
    }
  }
  return head.next;
};
