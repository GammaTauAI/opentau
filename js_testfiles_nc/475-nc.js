const minDeletionSize = function(A) {
      let numColumnsToDelete = 0;
      const strLength = A[0].length;
    for (let i = 0; i < strLength; i++) {
        for (let j = 0; j < A.length - 1; j++) {
       const top = A[j][i];
       const bottom = A[j + 1][i];
       if (top > bottom) {
          numColumnsToDelete++;
          break;
        }
      }
    }
    return numColumnsToDelete;
};
