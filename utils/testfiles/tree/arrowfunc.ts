function hello(name): string {
  let inner = (greeting) => {
    let myStuff = greeting + ", ";
    return myStuff;
  };
  return inner("Hello") + name;
}
