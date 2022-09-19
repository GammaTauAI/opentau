const deleteDuplicates = function(head) {
    let dummy = new ListNode(undefined);
    dummy.next = head;
    let prev = dummy;
    let curr = head;
    while(curr) {
      while(curr.next && curr.next.val === curr.val) {
        curr = curr.next;
      }
      if(prev.next === curr) {         prev = prev.next;
        curr = curr.next;
      } else {
        prev.next = curr.next;
        curr = curr.next;
      }
    }
    return dummy.next;
  };
