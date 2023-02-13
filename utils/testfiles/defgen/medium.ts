// Tests if simple-scoped objects generate the right types
function f(obj) {
  console.log(obj.a + obj.b);

  function g(obj_2) {
    console.log(obj_2.d + obj_2.e);
  }

  g({ d: 1, e: 2 });

  console.log(obj.d.e);

  obj.d.m();
}

// tests destructuring via object literals
function g(obj) {
  // how do we capture this?
  const { a, b } = obj;
  console.log(a + b);
}

// tests destructuring via let
function h(obj) {
  let a = obj.a;
  let b = obj.b;
  console.log(a + b);
}

// tests object parameter destructuring with inner function
// TODO: should we even bother with this?
// maybe transform to:
// function g2(obj) {
//  const { o1, o2 } = obj;
//  console.log(o1.a + o2.b);
// }
function g2({ o1, o2 }) {
  console.log(o1.a + o2.b);
}
