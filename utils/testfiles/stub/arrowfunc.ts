function hello(name): string {
  let inner = (greeting: string): string => {
    let myStuff = greeting + ", ";
    return myStuff;
  };
  return inner("Hello") + name;
}
