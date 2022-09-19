class Codec {
  constructor() {}
    encode = function(root) {
    if (root == null) return null
    let result = new TreeNode(root.val)
    if (root.children.length > 0) {
      result.left = this.encode(root.children[0])
    }
    let cur = result.left
    for (let i = 1; i < root.children.length; i++) {
      cur.right = this.encode(root.children[i])
      cur = cur.right
    }
    return result
  }
    decode = function(root) {
    if (root == null) return null
    let result = new Node(root.val, [])
    let cur = root.left
    while (cur != null) {
      result.children.push(this.decode(cur))
      cur = cur.right
    }
    return result
  }
}
