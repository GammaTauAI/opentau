// tests destructuring via let
function h(obj) {
  let a = obj.a.k.j;
  let b = obj.b;
  console.log(a.c.i + b.d);
}
