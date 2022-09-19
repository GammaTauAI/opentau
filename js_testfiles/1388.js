














var CBTInserter = function(root) {
    this.r = root
};





CBTInserter.prototype.insert = function(val) {
   let q = [this.r]
   
   while(q.length) {
     const tmp = []
     for(let i = 0; i < q.length; i++) {
       const cur = q[i]
       if(cur.left == null) {
         cur.left = new TreeNode(val)
         return cur.val
       } else tmp.push(cur.left)
       if(cur.right == null) {
         cur.right = new TreeNode(val)
         return cur.val
       } else tmp.push(cur.right)
     }
     
     q = tmp
   }
};




CBTInserter.prototype.get_root = function() {
    return this.r
};








