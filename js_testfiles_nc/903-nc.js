const tree2str = function(t) {
  if (!t) return ''
  const left = tree2str(t.left)
  const right = tree2str(t.right)
  if (right) return `${t.val}(${left})(${right})`
  else if (left) return `${t.val}(${left})`
  else return `${t.val}`
};
