








const rotateString = function(A, B) {
  if (A.length != B.length) return false;
  return A.concat(A).includes(B);
};

