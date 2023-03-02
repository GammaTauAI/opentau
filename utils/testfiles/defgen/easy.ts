function f(obj) {
  console.log(obj.a + obj.b);
}

// function that has a param that is not an object
function g(x, y, obj) {
  console.log(x + y);
  console.log(obj.a + obj.b);
}
