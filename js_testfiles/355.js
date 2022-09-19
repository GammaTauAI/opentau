











const shortestDistance = function(words, word1, word2) {
  let w1 = -1
  let w2 = -1
  let min = Number.MAX_VALUE
  for (let i = 0; i < words.length; i++) {
    if (words[i] === word1) {
      w1 = i
    } else if (words[i] === word2) {
      w2 = i
    }
    if (w1 >= 0 && w2 >= 0) {
      min = Math.min(min, Math.abs(w1 - w2))
    }
  }
  return min
}

