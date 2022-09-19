function sortList(head) {
  quickSort(head, null);
  return head;
}
function quickSort(head, tail) {
  if (head == tail) {
    return;
  }
  const slow = partition(head, tail);
  quickSort(head, slow);
  quickSort(slow.next, tail);
}
function swap(node1, node2) {
  let tmp = node1.val;
  node1.val = node2.val;
  node2.val = tmp;
}
function partition(head, tail) {
  let slow = head,
    fast = head.next;
  let p = head.val;
  while (fast != tail) {
    if (fast.val <= p) {
      slow = slow.next;
      swap(slow, fast);
    }
    fast = fast.next;
  }
  swap(head, slow);
  return slow;
}
function sortList(head) {
  if(head == null || head.next == null) return head
  let slow = head, fast = head, pre = null
  while(fast && fast.next) {
    pre = slow
    slow = slow.next
    fast = fast.next.next
  }
  pre.next = null
  const left = sortList(head)
  const right = sortList(slow)
  return merge(left, right)
}
function merge(left, right) {
  const dummy = new ListNode()
  let cur = dummy
  while(left && right) {
    if (left.val <= right.val) {
      cur.next = left
      left = left.next
    } else {
      cur.next = right
      right = right.next
    }
    cur = cur.next
  }
  if(left) {
    cur.next = left
  }
  if(right) {
    cur.next = right
  }
  return dummy.next
}
    function sortList(head) {
        quickSort(head, null);
        return head;
    }
    function quickSort( head,  tail){
        if (head == tail) {
            return;
        }
        let slow = head, fast = head.next;
        let p = head.val;
        while (fast != tail){
            if (fast.val <= p){
                slow = slow.next;
                swap(slow, fast);
            }
            fast = fast.next;
        }
        swap(head, slow);
        quickSort(head, slow);
        quickSort(slow.next, tail);
    }
    function swap( node1,  node2){
         let tmp = node1.val;
         node1.val = node2.val;
         node2.val = tmp;
    }
const sortList = function(head) {
    let dummy = new ListNode(0);
    dummy.next = head;
    const list = [];
    let done = (null === head);
        for (let step = 1; !done; step *= 2) {
      done = true;
      let prev = dummy;
      let remaining = prev.next;
      do {
                for (let i = 0; i < 2; ++i) {
          list[i] = remaining;
          let tail = null;
          for (let j = 0; j < step && null != remaining; ++j, remaining = remaining.next) {
            tail = remaining;
          }
                    if (null != tail) {
            tail.next = null;
          }
        }
                        done &= (null == remaining);
                if (null != list[1]) {
          while (null != list[0] || null != list[1]) {
            let idx = (null == list[1] || null != list[0] && list[0].val <= list[1].val) ? 0 : 1;
            prev.next = list[idx];
            list[idx] = list[idx].next;
            prev = prev.next;
          }
                    prev.next = null;
        } else {
                    prev.next = list[0];
        }
      } while (null !== remaining);
    }
    return dummy.next;
}
