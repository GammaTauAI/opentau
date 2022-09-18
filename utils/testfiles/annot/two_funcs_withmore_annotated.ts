for (let index: number = 0; index < 10; index++) {
  function add(num: number, num2: number): number {
    return num + num2;
  }
  console.log(add(index, index + 1));
}

function hello(name: string): string {
  function inner(greeting: string): string {
    let myStuff = greeting + ", ";
    return myStuff;
  }

  let myStuff2: string = "";
  for (let index: number = 0; index < 10; index++) {
    function addStr(s1: string, s2: string): string {
      return s1 + s2;
    }
    console.log(add(index, index + 1));
  }

  function inner2(greeting: string): string {
    let myStuff = greeting + ",,, ";
    return myStuff;
  }

  return inner("Hello") + inner2(", HELLOOO") + name;
}

console.log(hello("Federico"));
