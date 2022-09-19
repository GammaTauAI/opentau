const wonderfulSubstrings = (word) => {
  let res = 0, count = Array(1024).fill(0);
  let cur = 0;
  count[0] = 1;
  for (let i = 0; i < word.length; ++i) {
    const num = word[i].charCodeAt() - 97;
    cur ^= 1 << (num);
    res += count[cur];
    ++count[cur];
    for (let j = 0; j < 10; ++j) {
      res += count[cur ^ (1 << j)];
    }
  }
  return res;
};
const asi = (c) => c.charCodeAt();
const wonderfulSubstrings = (s) => {
    let res = 0;
    let f = Array(2 ** 10).fill(0);
    f[0] = 1;     let cur = res = 0;
    for (const c of s) {
        cur ^= 1 << asi(c) - 97;         res += f[cur];
        for (let i = 0; i < 10; i++) {             res += f[cur ^ 1 << i];         }
        f[cur]++;
    }
    return res;
};
