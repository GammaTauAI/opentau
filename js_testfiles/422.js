








function flat(arr, res) {
    for(let i = 0; i < arr.length; i++) {
        if(arr[i].isInteger()) {
           res.push(arr[i].getInteger())
        } else {
           flat(arr[i].getList() ,res)            
        }

    }
}
const NestedIterator = function(nestedList) {
    this.arr = []
    this.idx = -1
    flat(nestedList, this.arr)
};






NestedIterator.prototype.hasNext = function() {
    return this.idx + 1 < this.arr.length
};





NestedIterator.prototype.next = function() {
    this.idx += 1
    return this.arr[this.idx]
};







