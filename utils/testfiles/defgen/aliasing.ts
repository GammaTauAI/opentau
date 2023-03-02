// tests object aliasing

// function f(obj1, obj2) {
  // // simple case
  // let other = obj2;
  // other = obj2;
  // obj1.call(other);
  // other.c;
// }

// function g(obj1, obj2) {
  // // more complex case
  // const other = obj2.d;
  // obj1.c.call(other.e);
// }

function destruct(obj1, obj2) {
  const {
    a: { b },
  } = obj1;
  console.log(b.c);

  console.log(obj2.p)
  const { d: k, c: {b: j} } = obj2;
  console.log(j.o);
}
