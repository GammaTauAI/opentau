const palindromePairs = function(words) {
  const root = new Trie();
  const pairs = [];
  words.forEach((word, index) => addWord(word, index, root));
  words.forEach((word, index) => searchWord(word, index, root, pairs));
  return pairs;
};
const addWord = (word, wordIndex, root) => { 
  const length = word.length;
  let curr = root;
  for (let i = length - 1; i >= 0; i--) {
    let char = word.charAt(i);
    if (!curr.children[char]) curr.children[char] = new Trie();
    if (isPalindrome(0, i, word)) curr.words.push(wordIndex);
    curr = curr.children[char];
  }
  curr.wordIndex = wordIndex;
  curr.words.push(wordIndex);
}
const searchWord = (word, wordIndex, root, pairs) => {
  const length = word.length;
  let curr = root;
  for (let i = 0; i < length; i++) {
    let char = word.charAt(i);
    if (curr.wordIndex >= 0 && curr.wordIndex !== wordIndex && isPalindrome(i, length - 1, word)) {
      pairs.push([wordIndex, curr.wordIndex]);
    }
    curr = curr.children[char];
    if (!curr) return;
  }
  curr.words.forEach((suffix) => {
    if (suffix !== wordIndex) pairs.push([wordIndex, suffix]);
  })
}
const isPalindrome = (left, right, word) => {
  while (left < right) {
    if (word.charAt(left++) !== word.charAt(right--)) return false;
  }
  return true;
}
class Trie {
  constructor() {
    this.wordIndex = -1;
    this.children = {};
    this.words = [];
  }
}
const reverseStr = s => {
  let str = ''
  for (let i = 0; i < s.length; i++) {
    str = s[i] + str
  }
  return str
}
const isPalindrome = str => {
  for (let i = 0; i < str.length / 2; i++) {
    if (str[i] !== str[str.length - 1 - i]) return false
  }
  return true
}
const palindromePairs = function(words) {
  const map = new Map()
  words.forEach((word, idx) => map.set(word, idx))
  const result = []
  if (map.has('')) {
    const idx = map.get('')
    words.forEach((word, i) => {
      if (i !== idx && isPalindrome(word)) {
        result.push([idx, map.get(word)])
        result.push([map.get(word), idx])
      }
    })
  }
  map.delete('')
  words.forEach((word, idx) => {
    for (let i = 0; i < word.length; i++) {
      const left = word.slice(0, i)
      const right = word.slice(i)
      if (isPalindrome(left)) {
        const reversedRight = reverseStr(right)
        if (map.has(reversedRight) && map.get(reversedRight) !== idx) {
          result.push([map.get(reversedRight), idx])
        }
      }
      if (isPalindrome(right)) {
        const reversedLeft = reverseStr(left)
        if (map.has(reversedLeft) && map.get(reversedLeft) !== idx) {
          result.push([idx, map.get(reversedLeft)])
        }
      }
    }
  })
  return result
}
