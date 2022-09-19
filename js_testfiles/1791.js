









const generateAbbreviations = function(word) {
  const arr = []
  dfs(arr, word, 0, '', 0)
  return arr
};

function dfs(res, word, pos, cur, cnt) {
  if(pos === word.length) {
    if(cnt > 0) cur += cnt
    res.push(cur)
  } else {
    dfs(res, word, pos + 1, cur, cnt + 1)
    dfs(res, word, pos + 1, cur + (cnt > 0 ? cnt : '') + word.charAt(pos), 0)
  }
}

