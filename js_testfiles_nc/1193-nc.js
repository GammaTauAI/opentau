const maxSumBST = function (root) {
  let maxSum = 0
  postOrderTraverse(root)
  return maxSum
  function postOrderTraverse(root) {
    if (root == null) return [Number.MAX_VALUE, -Infinity, 0]     let left = postOrderTraverse(root.left)
    let right = postOrderTraverse(root.right)
        if (
      !(
        left != null &&         right != null &&         root.val > left[1] &&         root.val < right[0]
      )
    )
            return null
    let sum = root.val + left[2] + right[2]     maxSum = Math.max(maxSum, sum)
    let min = Math.min(root.val, left[0])
    let max = Math.max(root.val, right[1])
    return [min, max, sum]
  }
}
