

















const lowestCommonAncestor = function(p, q) {
  const pa = [], qa = []
  if(up(p, q, pa)) return q
  if(up(q, p, qa)) return p
  const set = new Set(pa)
  for(let i = 0; i < qa.length; i++) {
    if(set.has(qa[i])) return qa[i]
  }
  
  function up(node, target, arr) {
    if(node == null) return null
    if(node === target) return target
    arr.push(node)
    return up(node.parent, target, arr)
  }
};

// another















const lowestCommonAncestor = function(p, q) {
  let a = p, b = q;
	while (a !== b) {
		a = a == null? q : a.parent;
		b = b == null? p : b.parent;    
	}
	return a;
};

