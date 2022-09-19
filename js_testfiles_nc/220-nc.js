const canConvert = function(str1, str2) {
  if (str1 === str2) return true
  const map = new Map()
  for (let i = 0; i < str1.length; i++) {
    if (map.has(str1[i]) && map.get(str1[i]) !== str2[i]) {
      return false
    }
    map.set(str1[i], str2[i])
  }
  const set = new Set(map.values())
  return set.size < 26
}
