function hello(name: string): string {
  function inner(greeting: string): string {
    let myStuff: string = greeting + ", ";
    return myStuff;
  }
  function inner2(greeting: string): string {
    let myStuff: string = greeting + ",,, ";
    return myStuff;
  }
  return inner("Hello") + inner2(", HELLOOO") + name;
}

