const partition = function(head, x) {
    const leftHead = new ListNode(); 
    const rightHead = new ListNode(); 
    let left = leftHead;
    let right = rightHead;
        for (let node = head; node !== null; node = node.next) {
      if (node.val < x) {
        left.next = node;
        left = node;
      } else {
        right.next = node;
        right = node;
      }
    }
        left.next = rightHead.next;
    right.next = null;
    return leftHead.next;
};
const partition = function(head, x) {
    const left = []
    const right = []
    let containX = false
    let cur = head
    while(cur !== null) {
        if (containX === true) {
            if (cur.val < x) {
                left.push(cur)
            } else {
                right.push(cur)
            }
        } else {
            if (cur.val >= x) {
                containX = true
                right.push(cur)
            } else {
                left.push(cur)
            }
        }
        cur = cur.next
    }
    const arr = left.concat(right)
    for(let i = 0; i < arr.length; i++) {
        if (i === arr.length - 1) {
            arr[i].next = null
        } else {
            arr[i].next = arr[i+1]
        }
    }
    return arr[0] == null ? null : arr[0]
};
