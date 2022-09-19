const jump = function(nums) {
    if (nums.length <= 1) return 0;
    let curMax = 0;     let level = 0, i = 0;
    while (i <= curMax) { 
        let furthest = curMax;         for (; i <= curMax; i++) {
            furthest = Math.max(furthest, nums[i] + i);
            if (furthest >= nums.length - 1) return level + 1;
        }
        level++;
        curMax = furthest;
    }
    return -1; };
