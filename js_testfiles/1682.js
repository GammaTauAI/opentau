






const ThroneInheritance = function(kingName) {
  this.king = kingName
  this.m = {}
  this.dead = {}
};






ThroneInheritance.prototype.birth = function(parentName, childName) {
  if(!this.m[parentName]) this.m[parentName] = []
  this.m[parentName].push(childName)
};





ThroneInheritance.prototype.death = function(name) {
  this.dead[name] = 1
};




ThroneInheritance.prototype.getInheritanceOrder = function() {
  const res = []
  this.dfs(res, this.king)
  return res
};
ThroneInheritance.prototype.dfs = function(ans, root) {
  if (!this.dead[root]) {
    ans.push(root);
  }
  if(!this.m[root]) return
  for (let child of this.m[root]) {
    this.dfs(ans, child);
  }
};








