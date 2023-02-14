function foo() {
  let x = foo(3); // this is referencing the foo below
  function foo(x) {
    return x;
  }

  return x;
}
