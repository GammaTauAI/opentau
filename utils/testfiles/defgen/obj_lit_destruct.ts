// tests destructuring via object literals
function g(obj) {
  // how do we capture this?
  const { a, b } = obj;
  console.log(a + b);
  console.log(a.k, b.l);
}
