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
