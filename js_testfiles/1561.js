






const MyHashMap = function() {
    this.h = {}
};







MyHashMap.prototype.put = function(key, value) {
    this.h[key] = value
};






MyHashMap.prototype.get = function(key) {
   return {}.hasOwnProperty.call(this.h, key) ? this.h[key] : -1
};






MyHashMap.prototype.remove = function(key) {
    delete this.h[key]
};









