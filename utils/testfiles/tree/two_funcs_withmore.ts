for (let index = 0; index < 10; index++) {
  function add(num, num2) {
    return num + num2;
  }
  console.log(add(index, index + 1));
}

function hello(name): string {
  function inner(greeting: string): string {
    let myStuff = greeting + ", ";
    return myStuff;
  }

  let myStuff2 = "";
  for (let index = 0; index < 10; index++) {
    function addStr(s1, s2) {
      return s1 + s2;
    }
    console.log(add(index, index + 1));
  }

  function inner2(greeting) {
    let myStuff = greeting + ",,, ";
    return myStuff;
  }

  return inner("Hello") + inner2(", HELLOOO") + name;
}

console.log(hello("Federico"));
