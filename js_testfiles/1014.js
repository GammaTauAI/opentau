



class Node {
  constructor(val) {
    this.val = val
    this.cnt = 0
    this.children = {}
    this.wordCnt = 0
  }
}

const Trie = function () {
  this.root = new Node(null)
}





Trie.prototype.insert = function (word) {
  let cur = this.root
  for(const ch of word) {
    if(cur.children[ch] == null) cur.children[ch] = new Node(ch)
    cur.children[ch].cnt++
    cur = cur.children[ch]
  }
  cur.wordCnt++
}





Trie.prototype.countWordsEqualTo = function (word) {
  let cur = this.root
  for(const ch of word) {
    if(cur.children[ch] == null) return 0
    cur = cur.children[ch]
  }
  return cur.wordCnt
}





Trie.prototype.countWordsStartingWith = function (prefix) {
  let cur = this.root
  for(const ch of prefix) {
    if(cur.children[ch] == null) return 0
    cur = cur.children[ch]
  }
  return cur.cnt
}





Trie.prototype.erase = function (word) {
  let cur = this.root
  for(const ch of word) {
    if(cur.children[ch] == null) break
    cur.children[ch].cnt--
    cur = cur.children[ch]
  }
  cur.wordCnt--
}










