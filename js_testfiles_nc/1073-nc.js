const L = 2 ** 10;
const MAX = Number.MAX_SAFE_INTEGER;
const mi = Math.min;
const minChanges = (a, k) => {
    let n = a.length;
    let dp = Array(L).fill(MAX);
    dp[0] = 0;
    for (let i = 0; i < k; i++) {
        let tmp = Array(L).fill(0);
        let tot = 0;
        for (let j = i; j < n; j += k) {
            tmp[a[j]]++;             tot++;         }
        let ndp = Array(L).fill(0);
        let min = MAX;
        for (let j = 0; j < L; j++) {
            min = mi(min, dp[j]);
        }
        min += tot;
        ndp = ndp.map(x => x = min);         for (let j = 0; j < L; j++) {
            if (tmp[j] != 0) {
                for (let m = 0; m < L; m++) {
                    ndp[m ^ j] = mi(ndp[m ^ j], dp[m] + tot - tmp[j]);
                }
            }
        }
        dp = ndp;      }
    return dp[0];
};
