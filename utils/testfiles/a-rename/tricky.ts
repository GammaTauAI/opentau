function f(obj) {
  console.log(obj.b);
  function f(obj) {
    console.log(obj.a);
    console.log(obj.b);
  }
  function g(obj) {
    console.log(obj.a);
    console.log(obj.b);
    console.log(obj.c);
  }
  console.log(obj.a);
}
