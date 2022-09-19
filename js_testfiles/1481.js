










function numberOfDays(Y, M) {
  switch (M) {
    case 2:
      return Y % 400 === 0 || (Y % 4 === 0 && Y % 100 !== 0) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

// another

const numberOfDays = function(Y, M) {
    return new Date(Y,M,0).getDate();
};

// another






const numberOfDays = function(Y, M) {
  const d = new Date(Y, M - 1)
  let num = 0
  while(d.getMonth() === M - 1) {
    num++
    const n = d.getDate()
    d.setDate(n + 1)
  }
  return num
};

