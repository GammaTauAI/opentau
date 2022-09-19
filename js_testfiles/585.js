
















const getIntersectionNode = function(headA, headB) {
  let a = headA, b = headB
  while(a !== b) {
    a = a == null ? headB : a.next
    b = b == null ? headA : b.next
  }
  return a
};

// another














const getIntersectionNode = function(headA, headB) {
    let aend = null
    let bend = null
    let ahead = headA
    let bhead = headB
    while(headA !== null && headB !== null) {
        if (aend !== null && bend !== null && aend !== bend) {
            return null
        }

        if (headA === headB) {
            return headA
        }

        if (headA.next === null) {
            if(aend === null) {
                aend = headA
            }
            headA = bhead
        } else {
            headA = headA.next

        }
        if (headB.next === null) {
            if(bend === null) {
                bend = headB
            }
            headB = ahead
        } else {
            headB = headB.next
        }

    }

};

