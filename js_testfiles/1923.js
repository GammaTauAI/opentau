











const splitter = ",";






const serialize = function(root) {
  const sb = [];
  buildString(root, sb);
  sb.pop();
  return sb.join("");
};
function buildString(node, sb) {
  if (node == null) return;
  sb.push(node.val);
  sb.push(splitter);
  buildString(node.left, sb);
  buildString(node.right, sb);
}






const deserialize = function(data) {
  if (data.length === 0) return null;
  const pos = [0];
  return buildTree(
    data.split(splitter),
    pos,
    Number.MIN_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER
  );
};
function buildTree(nodes, pos, min, max) {
  if (pos[0] === nodes.length) return null;
  let val = +nodes[pos[0]];
  if (val < min || val > max) return null;
  const cur = new TreeNode(val);
  pos[0] += 1;
  cur.left = buildTree(nodes, pos, min, val);
  cur.right = buildTree(nodes, pos, val, max);
  return cur;
}






