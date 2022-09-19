














const deleteDuplicates = function(head) {
  let current = head;
  while (current !== null && current.next !== null) {
    if (current.val === current.next.val) {
      current.next = current.next.next;
    } else {
      current = current.next;
    }
  }
  return head;
};

// another












const deleteDuplicates = function(head) {
  let prev = null, cur = head
  while(cur) {
    if(prev && prev.val === cur.val) {
      prev.next = cur.next
      cur = cur.next
    } else {
      prev = cur
      cur = cur.next      
    }
  }
  return head
};


