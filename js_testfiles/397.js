







const countPrimes = function(n) {
  



  if (n < 3) return 0;

  

  let c = Math.floor(n / 2);

  

  let s = [];

  



  for (let i = 3; i * i < n; i += 2) {
    if (s[i]) {
      // c has already been decremented for this composite odd
      continue;
    }

    

    for (let j = i * i; j < n; j += 2 * i) {
      if (!s[j]) {
        c--;
        s[j] = true;
      }
    }
  }
  return c;
};

