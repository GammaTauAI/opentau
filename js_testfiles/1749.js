






const MyHashSet = function() {
    this.s = {}
};





MyHashSet.prototype.add = function(key) {
    this.s[key] = true
};





MyHashSet.prototype.remove = function(key) {
    delete this.s[key]
};






MyHashSet.prototype.contains = function(key) {
    return Object.prototype.hasOwnProperty.call(this.s, key)
};









