









const beforeAndAfterPuzzles = function(phrases) {
  const ret = new Set()
  const start = {}
  const splitArr = phrases.map(el => el.split(' '))
  for (let i = 0; i < splitArr.length; i++) {
    const firstWord = splitArr[i][0]
    start[firstWord] = start[firstWord] || []
    start[firstWord].push(i)
  }
  for (let i = 0; i < splitArr.length; i++) {
    const lastWord = splitArr[i][splitArr[i].length - 1]
    if (start[lastWord]) {
      for (let idx of start[lastWord]) {
        if (idx !== i) {
          ret.add(splitArr[i].concat(splitArr[idx].slice(1)).join(' '))
        }
      }
    }
  }
  return [...ret].sort()
}

