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
const findMaximumXOR = function(nums) {
  let maxResult = 0
  let mask = 0
  for (let i = 31; i >= 0; i--) {
            mask = mask | (1 << i)
    let set = new Set()
    for (let num of nums) {
      let leftPartOfNum = num & mask
      set.add(leftPartOfNum)
    }
                let greedyTry = maxResult | (1 << i)
    for (let leftPartOfNum of set) {
                              let anotherNum = leftPartOfNum ^ greedyTry
      if (set.has(anotherNum)) {
        maxResult = greedyTry
        break
      }
    }
          }
  return maxResult
}
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
