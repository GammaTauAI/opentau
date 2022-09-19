const pathInZigZagTree = function(label) {
  const res = [], { log2, floor, ceil } = Math
  const level = floor(log2(label))
  let compl = 2 ** (level + 1) - 1 + 2 ** level - label
  while(label) {
    res.push(label)
    label = floor(label / 2)
    compl = floor(compl / 2)
    ;[label, compl] = [compl, label]
  }
  res.reverse()
  return res
};
const pathInZigZagTree = function(label) {
  const res = [], { log2, floor, ceil } = Math
  res.push(label)
    const lev = ceil(log2(label + 1))
  const reverse = lev % 2 === 0 ? true : false
    if(reverse) {
    const idx = 2 ** lev - 1 - label
    label = 2 ** (lev - 1) + idx
  }
    while(label > 1) {
    const level = floor(log2(label))
    const parent = floor(label / 2)
    const parentLevelNum = 2 ** (level - 1)
    const parentReverse = level % 2 === 0 ? true : false
    const parentStart = 2 ** (level - 1)
    const parentEnd = 2 ** level - 1
        const idx = parent - parentStart
    res.push(parentReverse ? parentEnd - idx : parentStart + idx)
    label = parent
  }
  res.reverse()
  return res
};
