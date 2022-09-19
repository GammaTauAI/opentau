







const deleteDuplicateFolder = function(paths) {
  const trie = new Trie()
  for (const path of paths) {
    let cur = trie.trie
    cur.countPrefix++
    for (const name of path) {
      if(cur.children[name] == null) cur.children[name] = new TrieNode(name)
      cur = cur.children[name]
      cur.countPrefix++
    }
  }
  const folders = new Map()
  dfs1(trie.trie)
  for (const value of folders.values()) {
    if (value.length > 1) {
      // found the same dir, mark as to be deleted
      for (const node of value) {
        node.countPrefix = 0
      }
    }
  }
  const ans = []
  // traverse un-deleted dir, put them to result
  dfs2(trie.trie, [])
  return ans
  function dfs1 (node) {
    if (Object.keys(node.children).length === 0) {
      return `(${node.char})`
    }
    const childrenExp = []
    for (const key in node.children) {
      childrenExp.push(dfs1(node.children[key]))
    }
    const exp = childrenExp.sort((a, b) => a.localeCompare(b)).join('')
    if (!folders.has(exp)) {
      folders.set(exp, [])
    }
    folders.get(exp).push(node)
    return `(${node.char}${childrenExp.join('')})`
  }
  function dfs2 (node, path) {
    // already deleted, no need go further
    if (node.countPrefix === 0) {
      return
    }
    if (node.char !== '/') { path.push(node.char) }
    if (path.length) ans.push([...path])
    for (const key in node.children) {
      dfs2(node.children[key], path)
    }
    path.pop()
  } 
};
class TrieNode {
  constructor (char) {
    this.char = char
    this.count = 0
    this.countPrefix = 0
    this.children = {}
  }
};
class Trie {
  


  constructor () {
    this.trie = new TrieNode('/')
  }

  




  insert (str, count = 1) {
    let cur = this.trie
    for (const char of str) {
      cur.children[char] ??= new TrieNode(char)
      cur = cur.children[char]
      cur.countPrefix += count
    }
    cur.count += count
  }

  





  traverse (str, callbackfn, thisArg) {
    let cur = this.trie
    for (let i = 0; i < str.length; i++) {
      const retChar = callbackfn.call(thisArg, str[i], i, cur)
      const tmp = cur.children[retChar]
      if (!tmp || tmp.countPrefix <= 0) return
      cur = tmp
    }
  }

  



  count (str) {
    let ans = 0
    this.traverse(str, (char, idx, node) => {
      const nextNode = node.children[char]
      if (idx === str.length - 1 && nextNode) {
        ans = nextNode.count
      }
      return char
    })
    return ans
  }

  



  countPrefix (str) {
    let ans = 0
    this.traverse(str, (char, idx, node) => {
      const nextNode = node.children[char]
      ans += nextNode?.countPrefix ?? 0
      return char
    })
    return ans
  }
};

