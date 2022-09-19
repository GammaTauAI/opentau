const getSum = function(a, b) {
  return b === 0 ? a : getSum(a ^ b, (a & b) << 1);
};
