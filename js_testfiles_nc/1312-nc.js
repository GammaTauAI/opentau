const nearestPalindromic = function(n) {
  let bigInt = null
  if (typeof n === 'bigint') bigInt = n
  if (typeof n === 'string') bigInt = BigInt(n)
  if (typeof n == null) throw new Error('unknown input type')
    const prevPalindrome = getPrevPalindrome(bigInt)
  const nextPalindrome = getNextPalindrome(bigInt)
  const scalarPrev = bigInt - prevPalindrome
  const scalarNext = nextPalindrome - bigInt
  if (scalarPrev <= scalarNext) return prevPalindrome.toString()
  else return nextPalindrome.toString()
}
function getPrevPalindrome(number) {
  const decrementedNumber =
    typeof number === 'bigint' ? number - BigInt(1) : BigInt(number) - BigInt(1)
  if (decrementedNumber.toString().length === 1) return decrementedNumber
  const leftSide = getLeftSideNumber(decrementedNumber)
  const palindromedLeft = getPalindromeAsString(leftSide)
  const rightSide = getRightSideNumberAsString(decrementedNumber)
  const comparison = compareTwoValues(BigInt(palindromedLeft), BigInt(rightSide))
  if (comparison === 0) {
        return decrementedNumber
  }
  if (comparison === 1) {
                const leftWithBorder = getLeftSideNumberWithBorder(decrementedNumber)
    const decremented = leftWithBorder - BigInt(1)
    if (decremented === BigInt(0)) return BigInt(9)
    const newWhole = BigInt(decremented.toString() + getRightSideNumberAsString(decrementedNumber))
    const newLeft = getLeftSideNumber(newWhole)
    const palindromedNewLeft = getPalindromeAsString(newLeft)
    return BigInt(decremented.toString() + palindromedNewLeft.toString())
  }
  if (comparison === -1) {
            const leftSideWithBorder = getLeftSideNumberWithBorder(decrementedNumber)
    return BigInt(leftSideWithBorder.toString() + palindromedLeft)
  }
}
function getNextPalindrome(number) {
  const incrementedNumber =
    typeof number === 'bigint' ? number + BigInt(1) : BigInt(number) + BigInt(1)
  if (incrementedNumber.toString().length === 1) return incrementedNumber
  const leftSide = getLeftSideNumber(incrementedNumber)
  const palindromedLeft = getPalindromeAsString(leftSide)
  const rightSide = getRightSideNumberAsString(incrementedNumber)
  const comparison = compareTwoValues(BigInt(palindromedLeft), BigInt(rightSide))
  if (comparison === 0) {
        return incrementedNumber
  }
  if (comparison === 1) {
            const leftSideWithBorder = getLeftSideNumberWithBorder(incrementedNumber)
    const leftAsString = leftSideWithBorder.toString()
    const combined = leftAsString + palindromedLeft
    return BigInt(combined)
  }
  if (comparison === -1) {
                const leftWithBorder = getLeftSideNumberWithBorder(incrementedNumber)
    const incrementedLeftWithBorder = leftWithBorder + BigInt(1)
    const newWhole = BigInt(
      incrementedLeftWithBorder.toString() + getRightSideNumberAsString(incrementedNumber)
    )
    const newLeft = getLeftSideNumber(newWhole)
    const palindromedNewLeft = getPalindromeAsString(newLeft)
    return BigInt(incrementedLeftWithBorder.toString() + palindromedNewLeft.toString())
  }
}
function getLeftSideNumber(number) {
  const numberAsText = number.toString()
  const numCharsInLeftSide = Math.floor(numberAsText.length / 2)
  return BigInt(numberAsText.slice(0, numCharsInLeftSide))
}
function getLeftSideNumberWithBorder(number) {
  const numberAsText = number.toString()
  const hasOddNumChars = numberAsText.length % 2 === 1
  const left = getLeftSideNumber(number)
      if (hasOddNumChars) {
    const middleChar = numberAsText.charAt(Math.floor(numberAsText.length / 2))
    return BigInt(left.toString() + middleChar)
  } else {
    return BigInt(left.toString())
  }
}
function getRightSideNumberAsString(number) {
  const numberAsText = number.toString()
  const numCharsInRightSide = Math.floor(numberAsText.length / 2)
  return numberAsText.slice(numberAsText.length - numCharsInRightSide)
}
function getPalindromeAsString(number) {
  const numberAsText = number.toString()
  return numberAsText
    .split('')
    .reverse()
    .join('')
}
function compareTwoValues(number1, number2) {
  if (number1 < number2) return -1
  if (number1 === number2) return 0
  if (number1 > number2) return 1
}
