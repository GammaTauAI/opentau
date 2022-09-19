








const deserialize = function(s) {
  const recursion = s => {
    const re = new NestedInteger()
    if (!s || s.length === 0) {
      return re
    }
    if (s.charAt(0) !== '[') {
      re.setInteger(parseInt(s, 10))
    } else if (s.length > 2) {
      let start = 1
      let cnt = 0
      for (let i = 1; i < s.length; i++) {
        const char = s.charAt(i)
        if (cnt === 0 && (char === ',' || i === s.length - 1)) {
          re.add(recursion(s.substring(start, i)))
          start = i + 1
        } else if (char === '[') {
          cnt++
        } else if (char === ']') {
          cnt--
        }
      }
    }
    return re
  }
  return recursion(s)
}

