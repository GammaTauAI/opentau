const FileSystem = function () {
  this.items = new Map()
}
FileSystem.prototype.ls = function (path) {
  const paths = path.split('/').filter((p) => !!p.length)
  let curr = this.items
  let last = ''
  for (const p of paths) {
    curr = curr.get(p)
    last = p
  }
  const list = Array.from(curr.keys()).filter((e) => e !== 'content')
  if (curr.has('content')) list.push(last)
  return list.sort()
}
FileSystem.prototype.mkdir = function (path) {
  const paths = path.split('/').filter((p) => !!p.length)
  let curr = this.items
  for (const p of paths) {
    if (!curr.has(p)) {
      curr.set(p, new Map())
    }
    curr = curr.get(p)
  }
}
FileSystem.prototype.addContentToFile = function (filePath, content) {
  const paths = filePath.split('/').filter((p) => !!p.length)
  let curr = this.items
  for (const p of paths) {
    if (!curr.has(p)) {
      curr.set(p, new Map())
    }
    curr = curr.get(p)
  }
  curr.set('content', (curr.get('content') || '') + content)
}
FileSystem.prototype.readContentFromFile = function (filePath) {
  const paths = filePath.split('/').filter((p) => !!p.length)
  let curr = this.items
  for (const p of paths) {
    curr = curr.get(p)
  }
  return curr.get('content')
}
const FileSystem = function () {
  this.root = new Node()
}
FileSystem.prototype.ls = function (path) {
  const cur = this.find(path)
  if(cur.content) {
    const arr = path.split('/')
    return [arr[arr.length - 1]]
  }
  return Object.keys(cur.children).sort()
}
FileSystem.prototype.mkdir = function (path) {
  this.find(path)
}
FileSystem.prototype.addContentToFile = function (filePath, content) {
  const cur = this.find(filePath)
  cur.content += content
}
FileSystem.prototype.readContentFromFile = function (filePath) {
  const cur = this.find(filePath)
  return cur.content
}
FileSystem.prototype.find = function (filePath) {
  if(filePath.length === 1) return this.root
  const arr = filePath.split('/').slice(1)
  let cur = this.root
  for(let e of arr) {
    if (cur.children[e] == null) cur.children[e] = new Node()
    cur = cur.children[e]
  }
  return cur
}
class Node {
  constructor() {
    this.children = {}
    this.content = ''
  }
}
