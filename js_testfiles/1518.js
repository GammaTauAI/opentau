

















const findDistance = function(root, p, q) {
  if(p === q) return 0
  return dfs(root, 0)

  function dfs(node, depth) {
    let res = depth
    if (node == null) {
      res = 0
    } else if(node.val === p || node.val === q) {
      let left = dfs(node.left, 1)
      let right = dfs(node.right, 1)
      res = (left > 0 || right > 0) ? Math.max(left, right) : res
    } else {
      let left = dfs(node.left, depth + 1)
      let right = dfs(node.right, depth + 1)
      res = left + right
      if(left !== 0 && right !== 0) {
        res -= 2 * depth
      }
    }
    return res
  }
};

// another















const findDistance = function (root, p, q) {
  if (p == q) return 0
  let result = -1
  dfs(root, p, q)
  return result

  







  function dfs(root, p, q) {
    if (root == null) return -1

    let left = dfs(root.left, p, q)
    let right = dfs(root.right, p, q)

    if (root.val == p || root.val == q) {
      // root is p or q, but none of p or q is a descendent of root.
      // The distance from root to one of p and q is 0 in this case.
      if (left < 0 && right < 0) {
        return 0
      }

      // root is p or q, and root is also the LCA of p and q.
      result = 1 + (left >= 0 ? left : right)
      return -1
    }

    // root is neither p nor q, but it is the LCA of p and q.
    if (left >= 0 && right >= 0) {
      result = left + right + 2
      return -1
    }

    if (left >= 0) {
      return left + 1
    }

    if (right >= 0) {
      return right + 1
    }

    return -1
  }
}

// another















const findDistance = function (root, p, q) {
  let lca = lowestCommonAncestor(root, p, q)

  const queue = []
  queue.push(lca)
  let dp = -1,
    dq = -1
  let d = 0
  while (queue.length && (dp == -1 || dq == -1)) {
    for (let k = queue.length; k > 0; k--) {
      let node = queue.shift()
      if (node.val == p) {
        dp = d
      }

      if (node.val == q) {
        dq = d
      }

      if (node.left != null) {
        queue.push(node.left)
      }

      if (node.right != null) {
        queue.push(node.right)
      }
    }
    d++
  }

  return dp + dq

  function lowestCommonAncestor(root, p, q) {
    if (root == null || root.val == p || root.val == q) {
      return root
    }
    let left = lowestCommonAncestor(root.left, p, q)
    let right = lowestCommonAncestor(root.right, p, q)

    return left == null ? right : right == null ? left : root
  }
}


