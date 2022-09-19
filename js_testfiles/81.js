
















const plusOne = function(head) {
  const dummy = new ListNode(1)
  dummy.next = head
  const carry = plusOneRecursion(head)
  return carry ? dummy : dummy.next
}
const plusOneRecursion = node => {
  if (!node) return 1
  node.val += plusOneRecursion(node.next)
  if (node.val > 9) {
    node.val %= 10
    return 1
  }
  return 0
}

// another





const plusOne = function(head) {
  const dummy = new ListNode(0)
  dummy.next = head
  let node = head
  let lastNotNine = dummy
  while(node) {
    if(node.val !== 9) lastNotNine = node
    node = node.next
  }
  lastNotNine.val++
  node = lastNotNine.next
  while(node) {
    node.val = 0
    node = node.next
  }
  return dummy.val === 1 ? dummy : dummy.next
}



