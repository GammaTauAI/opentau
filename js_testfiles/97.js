







const findMaximumXOR = function(nums) {
  let res = 0, mask = 0
  for(let i = 31; i >= 0; i--) {
    mask = mask | (1 << i)
    const set = new Set()
    for(let e of nums) set.add(e & mask)
    const tmp = res | (1 << i)
    for(let e of set) {
      if(set.has(e ^ tmp)) {
         res = tmp
         break
      }
    }
  }
  return res
};

// another












const findMaximumXOR = function(nums) {
  let maxResult = 0
  let mask = 0
  





  for (let i = 31; i >= 0; i--) {
    //The mask will grow like  100..000 , 110..000, 111..000,  then 1111...111
    //for each iteration, we only care about the left parts
    mask = mask | (1 << i)

    let set = new Set()
    for (let num of nums) {
      

      let leftPartOfNum = num & mask
      set.add(leftPartOfNum)
    }

    // if i = 1 and before this iteration, the maxResult we have now is 1100,
    // my wish is the maxResult will grow to 1110, so I will try to find a candidate
    // which can give me the greedyTry;
    let greedyTry = maxResult | (1 << i)

    for (let leftPartOfNum of set) {
      //This is the most tricky part, coming from a fact that if a ^ b = c, then a ^ c = b;
      // now we have the 'c', which is greedyTry, and we have the 'a', which is leftPartOfNum
      // If we hope the formula a ^ b = c to be valid, then we need the b,
      // and to get b, we need a ^ c, if a ^ c exisited in our set, then we're good to go
      let anotherNum = leftPartOfNum ^ greedyTry
      if (set.has(anotherNum)) {
        maxResult = greedyTry
        break
      }
    }

    // If unfortunately, we didn't get the greedyTry, we still have our max,
    // So after this iteration, the max will stay at 1100.
  }
  return maxResult
}

// another





const findMaximumXOR = function (nums) {
  if (nums == null || nums.length == 0) {
    return 0
  }
  const root = new Trie()
  for (let num of nums) {
    let curNode = root
    for (let i = 31; i >= 0; i--) {
      let curBit = (num >>> i) & 1
      if (curNode.children[curBit] == null) {
        curNode.children[curBit] = new Trie()
      }
      curNode = curNode.children[curBit]
    }
  }
  let max = Number.MIN_VALUE
  for (let num of nums) {
    let curNode = root
    let curSum = 0
    for (let i = 31; i >= 0; i--) {
      let curBit = (num >>> i) & 1
      if (curNode.children[curBit ^ 1] != null) {
        curSum += 1 << i
        curNode = curNode.children[curBit ^ 1]
      } else {
        curNode = curNode.children[curBit]
      }
    }
    max = Math.max(curSum, max)
  }
  return max
}

class Trie {
  constructor() {
    this.children = {}
  }
}

