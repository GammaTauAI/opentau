const hasCycle = function(head) {
  const seen = []
  while(head != null) {
        if(seen.indexOf(head) !== -1) {
          return true
        } else {
          seen.push(head)
        }
        head = head.next
  }
  return false
};
