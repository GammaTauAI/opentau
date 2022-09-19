const maxDistance = function(arrays) {
  if (arrays == null) return 0
  let result = 0
  let min = arrays[0][0]
  let max = arrays[0][arrays[0].length - 1]
  for (let i = 1; i < arrays.length; i++) {
    result = Math.max(
      result,
      Math.abs(arrays[i][arrays[i].length - 1] - min),
      Math.abs(arrays[i][0] - max)
    )
    max = Math.max(max, arrays[i][arrays[i].length - 1])
    min = Math.min(min, arrays[i][0])
  }
  return result
}
