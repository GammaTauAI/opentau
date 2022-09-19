const isArmstrong = function(n) {
        let k = ~~(Math.log10(n) + 1);
        let x = n;
        let sum = 0;
        while (x !== 0) {
                sum += Math.pow(x % 10, k);
                x = ~~(x/10);
    }
    return sum == n;
};
