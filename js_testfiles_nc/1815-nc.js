const superpalindromesInRange = function (L, R) {
                          const sqL = Math.sqrt(L)
  const sqR = Math.sqrt(R)
  const sqR_Length = parseInt(sqR).toString(10).length
    let palins = 0
    if (
    isPalindrome(L) &&
    sqL === parseInt(sqL) &&
    isPalindrome(sqL.toString(10))
  )
    palins++
    if (
    isPalindrome(R) &&
    sqR === parseInt(sqR) &&
    isPalindrome(sqR.toString(10))
  )
    palins++
  let end
  if (sqR === parseInt(sqR)) {
        end = parseInt(sqR) - 1
  } else {
    end = parseInt(Math.floor(sqR))
  }
  let begin
  if (sqL === parseInt(sqL)) {
        begin = parseInt(sqL) + 1
  } else {
    begin = parseInt(Math.ceil(sqL))
  }
    if (begin <= 1 && end >= 1) palins++   if (begin <= 2 && end >= 2) palins++   if (begin <= 3 && end >= 3) palins++   const length = sqR_Length
  const even = length % 2 === 0
  const half = Math.floor(length / 2)
  const pow10Half = Math.pow(10, half)   const pow10HalfMinOne = Math.pow(10, half - 1)
  let pal = ''   let palinStr = ''   let palin = -1   for (let i = 1, leni = pow10Half; i < leni; i++) {
    pal = i.toString(10)
    pal.padStart(half - pal.length, '0')
    palReverse = reverseStr(pal)
        palinStr = pal + palReverse
    palin = parseInt(palinStr)
    if (palin >= begin && palin <= end) {
      if (isPalindromeInt(BigInt(palin) * BigInt(palin))) {
        palins++
      }
    }
                if (even && i >= pow10HalfMinOne) {
      continue
    }
    for (let j = 0, lenj = 10; j < lenj; j++) {
            palinStr = pal + j + palReverse
      palin = parseInt(palinStr)
      if (palin >= begin && palin <= end) {
        if (isPalindromeInt(BigInt(palin) * BigInt(palin))) {
          palins++
        }
      }
    }
  }
  return palins
}
const reverseStr = function (str) {
  return str.split('').reverse().join('')
}
const isPalindromeInt = function (nr) {
  nr = nr.toString(10)
  return nr === nr.split('').reverse().join('')
}
const isPalindrome = function (nr) {
  return nr === nr.split('').reverse().join('')
}
 const superpalindromesInRange = function(left, right) {
  const palindromes = []
  let res = 0
  for(let i = 1; i < 10; i++) {
    palindromes.push(`${i}`)
  }
  for(let i = 1; i < 1e4; i++) {
    let l = `${i}`, r = l.split('').reverse().join('')
    palindromes.push(`${l}${r}`)
    for(let j = 0; j < 10; j++) {
      palindromes.push(`${l}${j}${r}`)
    }
  }
  for(let p of palindromes) {
    const square = BigInt(p) * BigInt(p)
    if(!isPalindrome(`${square}`)) continue
    if(BigInt(left) <= square && square <= BigInt(right)) res++ 
  }
  return res
  function isPalindrome(str) {
    let i = 0;
    let j = str.length - 1;
    while (i < j) {
      if (str.charAt(i) !== str.charAt(j)) {
        return false;
      }
      i++;
      j--;
    }
    return true;
  }
};
const superpalindromesInRange = function (left, right) {
  let ans = 9 >= left && 9 <= right ? 1 : 0
  const isPal = (str) => {
    for (let i = 0, j = str.length - 1; i < j; i++, j--)
      if (str.charAt(i) !== str.charAt(j)) return false
    return true
  }
  for (let dig = 1; dig < 10; dig++) {
    let isOdd = dig % 2 && dig !== 1,
      innerLen = (dig >> 1) - 1,
      innerLim = Math.max(1, 2 ** innerLen),
      midPos = dig >> 1,
      midLim = isOdd ? 3 : 1
    for (let edge = 1; edge < 3; edge++) {
      let pal = new Uint8Array(dig)
      ;(pal[0] = edge), (pal[dig - 1] = edge)
      if (edge === 2) (innerLim = 1), (midLim = Math.min(midLim, 2))
      for (let inner = 0; inner < innerLim; inner++) {
        if (inner > 0) {
          let innerStr = inner.toString(2).padStart(innerLen, '0')
          for (let i = 0; i < innerLen; i++)
            (pal[1 + i] = innerStr[i]), (pal[dig - 2 - i] = innerStr[i])
        }
        for (let mid = 0; mid < midLim; mid++) {
          if (isOdd) pal[midPos] = mid
          let palin = ~~pal.join(''),
            square = BigInt(palin) * BigInt(palin)
          if (square > right) return ans
          if (square >= left && isPal(square.toString())) ans++
        }
      }
    }
  }
  return ans
}
