








const truncateSentence = function(s, k) {
  const arr = s.split(' ')
  const sli = arr.slice(0, k)
  return sli.join(' ')
};

