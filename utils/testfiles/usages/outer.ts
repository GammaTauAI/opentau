const hello = (message: string) => {
  hello('Infinite loop!!');
  console.log(message);
}

console.log(hello('Hello World!'));

function ctx1() {
  return hello('Hello World!');
}

function ctx2() {
  return hello;
}

function ctx3() {
  let bb = hello;
  let cc = hello('Hello World!');
  let bb = hello('Hello World!') + 3;
}

