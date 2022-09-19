var removeOccurrences = function(s, part) {
  while(s.indexOf(part) !== -1) {
    const idx = s.indexOf(part)
    s = s.slice(0, idx) + s.slice(idx + part.length)
      }
  return s
};
