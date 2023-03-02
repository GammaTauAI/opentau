// tests destructuring via object literals with property access
function i(obj) {
  const {
    a: k,
    b,
    c: { d },
  } = obj.prop;
  console.log(k + b.f + d);
}
