const partitionLabels = function (S) {
  if (S == null || S.length === 0) {
    return null
  }
  const list = []
    const map = new Array(26).fill(0)
  const a = 'a'.charCodeAt(0)
  for (let i = 0, len = S.length; i < len; i++) {
    map[S.charCodeAt(i) - a] = i
  }
    let last = 0
  let start = 0
  for (let i = 0, len = S.length; i < len; i++) {
    last = Math.max(last, map[S.charCodeAt(i) - a])
    if (last === i) {
      list.push(last - start + 1)
      start = last + 1
    }
  }
  return list
}
