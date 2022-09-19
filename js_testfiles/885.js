















const copyRandomList = function(head) {
      if (head == null) {
        return null;
      }
  
      // Creating a new weaved list of original and copied nodes.
      let ptr = head;
      while (ptr != null) {
  
        // Cloned node
        const newNode = new RandomListNode(ptr.label);
  
        // Inserting the cloned node just next to the original node.
        // If A->B->C is the original linked list,
        // Linked list after weaving cloned nodes would be A->A'->B->B'->C->C'
        newNode.next = ptr.next;
        ptr.next = newNode;
        ptr = newNode.next;
      }
  
      ptr = head;
  
      // Now link the random pointers of the new nodes created.
      // Iterate the newly created list and use the original nodes' random pointers,
      // to assign references to random pointers for cloned nodes.
      while (ptr != null) {
        ptr.next.random = (ptr.random != null) ? ptr.random.next : null;
        ptr = ptr.next.next;
      }
  
      // Unweave the linked list to get back the original linked list and the cloned list.
      // i.e. A->A'->B->B'->C->C' would be broken to A->B->C and A'->B'->C'
      let ptr_old_list = head; // A->B->C
      let ptr_new_list = head.next; // A'->B'->C'
      let head_old = head.next;
      while (ptr_old_list != null) {
        ptr_old_list.next = ptr_old_list.next.next;
        ptr_new_list.next = (ptr_new_list.next != null) ? ptr_new_list.next.next : null;
        ptr_old_list = ptr_old_list.next;
        ptr_new_list = ptr_new_list.next;
      }
      return head_old;
};

