var TreeAncestor = function(n, parent) {
        this.P = Array.from({length: 20}, () => Array(n).fill(-1))
        for(let i = 0; i < parent.length; i++){
        this.P[0][i] = parent[i];
    }
        for(let i = 1; i < 20; i++){
        for(let node = 0; node < parent.length; node++){
            let nodep = this.P[i-1][node];
            if(nodep != -1) this.P[i][node] = this.P[i-1][nodep];
        }
    }  
};
TreeAncestor.prototype.getKthAncestor = function(node, k) {
    for(let i = 0; i < 20; i++){
        if(k & (1 << i)){
            node = this.P[i][node];
            if(node == -1) return -1;
        }
    }
    return node; 
};
