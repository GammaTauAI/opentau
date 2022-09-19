var possibleToStamp = function(grid, stampHeight, stampWidth) {
    let d = [];
    let a = grid;
    let h = grid.length;
    let w = grid[0].length;
    for (let i = 0; i <= h; i++) {
        d[i] = new Array(w + 1).fill(0);
    }
        for (let i = h - 1; i >= 0; i--) {
        for (let j = 0; j < w; j++) {
            if (a[i][j] === 0) d[i][j] = d[i + 1][j] + 1;
        }
    }
        for (let i = 0; i < h; i++) {
        let columns = 0;         for (let j = 0; j <= w; j++) {
            if (d[i][j] >= stampHeight) {                 columns++;
                if (columns >= stampWidth) {
                                        if (columns === stampWidth) {
                                                for (let l = j - stampWidth + 1; l <= j; l++) {
                            a[i][l] = stampHeight
                        }
                    } else {
                        a[i][j] = stampHeight;
                    }
                }
            } else {
                columns = 0;
            }
        }
                for (let l = 0; l < w; l++) {
            if (a[i][l] > 1) {
                a[i + 1][l] = a[i][l] - 1;
            }
        }
    }
        let ans = true;
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            if (a[i][j] === 0) ans = false;
        }
    }
    return ans;  
};
