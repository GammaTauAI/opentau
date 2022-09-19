









const minTransfers = function(transactions) {
  if (transactions.length === 0) return 0;
  const map = new Map();
  for (let [a, b, m] of transactions) {
    if (!map.has(a)) map.set(a, 0);
    if (!map.has(b)) map.set(b, 0);
    map.set(a, map.get(a) - m);
    map.set(b, map.get(b) + m);
  }
  const debts = [...map.values()].filter(debt => debt !== 0);
  const len = debts.length;
  const dfs = (id, d) => {
    if (id >= d.length) return 0;
    const cur = d[id];
    if (cur === 0) return dfs(id + 1, d);

    let res = Infinity;
    for (let i = id + 1; i < len; i++) {
      const next = d[i];
      if (cur * next < 0) {
        d[i] = cur + next;
        res = Math.min(res, 1 + dfs(id + 1, d));
        d[i] = next;
        if (next + cur === 0) break;
      }
    }
    return res;
  };
  return dfs(0, debts);
};

