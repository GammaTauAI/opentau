const copyRandomList = function(head) {
      if (head == null) {
        return null;
      }
            let ptr = head;
      while (ptr != null) {
                const newNode = new RandomListNode(ptr.label);
                                newNode.next = ptr.next;
        ptr.next = newNode;
        ptr = newNode.next;
      }
      ptr = head;
                        while (ptr != null) {
        ptr.next.random = (ptr.random != null) ? ptr.random.next : null;
        ptr = ptr.next.next;
      }
                  let ptr_old_list = head;       let ptr_new_list = head.next;       let head_old = head.next;
      while (ptr_old_list != null) {
        ptr_old_list.next = ptr_old_list.next.next;
        ptr_new_list.next = (ptr_new_list.next != null) ? ptr_new_list.next.next : null;
        ptr_old_list = ptr_old_list.next;
        ptr_new_list = ptr_new_list.next;
      }
      return head_old;
};
