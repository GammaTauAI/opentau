const removeNthFromEnd = (head, n) => {
  if (head.next === null) return null;
  let ptrBeforeN = head;
  let count = 1;
    let el = head.next;
  while (el !== null) {
    if (count > n) ptrBeforeN = ptrBeforeN.next;
    el = el.next;
    count++;
  }
  if (count === n) return head.next;
  ptrBeforeN.next = ptrBeforeN.next.next;
  return head;
};
