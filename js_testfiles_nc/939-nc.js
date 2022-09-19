const numPairsDivisibleBy60 = function(time) {
  const count = new Map();
  let n = 0;
  for (let t of time) {
        let d = (60 - t % 60) % 60;
    if (count.has(d)) { n += count.get(d); }
    count.set(t % 60, 1 + (count.get(t % 60) || 0));
  }
  return n;
};
