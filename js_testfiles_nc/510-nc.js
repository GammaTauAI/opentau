const deleteNode = function(node) {
  if (node.next !== null) {
    node.val = node.next.val;
    node.next = node.next.next;
  }
};
