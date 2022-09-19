

















const serialize = function(root) {
  return rserialize(root, "");
};

function rserialize(root, str) {
  if (root === null) {
    str += "null,";
  } else {
    str += root.val + ",";
    str = rserialize(root.left, str);
    str = rserialize(root.right, str);
  }

  return str;
}






const deserialize = function(data) {
  let data_array = data.split(",").filter(el => el !== "");
  return rdeserialize(data_array);
};

function rdeserialize(l) {
  if (l[0] === "null") {
    l.shift();
    return null;
  }
  const root = new TreeNode(+l[0]);
  l.shift();
  root.left = rdeserialize(l);
  root.right = rdeserialize(l);
  return root;
}





