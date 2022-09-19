var findFinalValue = function(nums, original) {
    let res = original
    while(nums.indexOf(res) !== -1) {
            res *= 2
    }
    return res
};
