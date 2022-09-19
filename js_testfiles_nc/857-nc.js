const bitwiseComplement = function (N) {
  if (N === 0) return 1
    let bitmask = N
  bitmask |= bitmask >> 1
  bitmask |= bitmask >> 2
  bitmask |= bitmask >> 4
  bitmask |= bitmask >> 8
  bitmask |= bitmask >> 16
    return bitmask ^ N
}
const bitwiseComplement = function (N) {
  let X = 1;
  while (N > X) X = X * 2 + 1;
  return N ^ X;
}
const bitwiseComplement = function (N) {
  if (N === 0) return 1
    const l = Math.floor(Math.log(N) / Math.log(2)) + 1
    const bitmask = (1 << l) - 1
    return bitmask ^ N
}
