function hello(name): string {
  function inner(greeting: string): string {
    let myStuff = greeting + ", ";
    return myStuff;
  }
  return inner("Hello") + name;
}
