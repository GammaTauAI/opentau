







const CombinationIterator = function (characters, combinationLength) {
  this.arr = build(combinationLength, characters.split('').sort().join(''))
  this.pos = 0
}




CombinationIterator.prototype.next = function () {
  if (this.pos < this.arr.length) {
    return this.arr[this.pos++]
  }
}




CombinationIterator.prototype.hasNext = function () {
  return this.pos < this.arr.length
}







function build(max, str, out = [], curr = '') {
  if (curr.length === max) {
    out.push(curr)
    return
  } else {
    for (let i = 0; i < str.length; i++) {
      build(max, str.slice(i + 1), out, curr + str[i])
    }
  }

  return out
}

