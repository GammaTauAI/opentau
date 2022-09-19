const largestTimeFromDigits = function(A) {
    let ans = "";
    for (let i = 0; i < 4; ++i) {
        for (let j = 0; j < 4; ++j) {
            for (let k = 0; k < 4; ++k) {
                                if (i == j || i == k || j == k) continue; 
                                let h = "" + A[i] + A[j], m = "" + A[k] + A[6 - i - j - k], t = h + ":" + m; 
                                if (h < "24" && m < "60" && ans < t) ans = t; 
            }
        }
    }
    return ans;
};
