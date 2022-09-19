























const isSubPath = function(head, root) {
  const res = { found: false }
  traverse(root, head, res)
  return res.found
};

function traverse(node, list, res) {
  if(res.found) return
  if(node == null) return
  if(node.val === list.val && helper(node, list)) {
    res.found = true
    return
  } 
  traverse(node.left, list, res)
  traverse(node.right, list, res)
}

function helper(node, list) {
  if(list == null) return true
  if(node == null) return false
  if(list.val !== node.val) return false
  return helper(node.left, list.next) || helper(node.right, list.next)
}

