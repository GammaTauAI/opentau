function hello(name1: string, name2: string): string {
  function inner() {
    let myStuff = "Hello, ";
    return myStuff;
  }
  return inner() + name1 + ", " + inner() + name2;
}

console.log(hello("John", "Smith"));
