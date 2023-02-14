// tests destructuring via let
function h(obj) {
  const { a, b } = obj;
  console.log(a + b);
}

// tests object parameter destructuring with inner function
function g2({ o1, o2 }) {
  console.log(o1.a + o2.b);
}

