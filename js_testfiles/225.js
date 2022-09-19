








const myPow = function(x, n) {
  if (n === 0) return 1;
  if (n === 1) return x;
  if (x === 0) return 0;

  if (n > 0) {
    return (n % 2 === 1 ? x : 1) * myPow(x * x, Math.floor(n / 2));
  } else {
    return myPow(1 / x, -n);
  }
};

// another






const myPow = function(x, n) {
  if(n === 0) return 1
  if(n === 1) return x
  if(n < 0) {
    x = 1 / x
    n = -n
  }
  return n % 2 === 1 ? myPow(x, ~~(n / 2)) ** 2 * x : myPow(x, ~~(n / 2)) ** 2
};

// another






const myPow = function (x, n) {
  if (n === 0) return 1
  if (n < 0) {
    if (n === -(2 ** 31)) {
      ++n
      n = -n
      x = 1 / x
      return x * x * myPow(x * x, n / 2)
    }
    n = -n
    x = 1 / x
  }
  return n % 2 == 0 ? myPow(x * x, n / 2) : x * myPow(x * x, (n / 2) >> 0)
}

// another






const myPow = function (x, n) {
  if (n === 0) return 1
  if (n < 0) {
    n = -n
    x = 1 / x
  }
  let res = 1
  while (n > 0) {
    if (n & 1) {
      res *= x
      --n
    }
    x *= x
    n /= 2
  }
  return res
}


