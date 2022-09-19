
















const flatten = function (head) {
  const handle = (node, next = null) => {
    if (!node) return null;
    handle(node.next, next);
    const child = handle(node.child, node.next);
    if (!node.next && next) {
      node.next = next;
      next.prev = node;
    }
    if (child) {
      node.next = child;
      node.child = null;
      child.prev = node;
    }
    return node;
  };
  return handle(head);
};

