function hello(name): string {
  function inner() {
    let myStuff = "Hello, ";
    return myStuff;
  }
  return inner() + name;
}

console.log(hello("Noah"));
