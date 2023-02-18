// Testing alpha rename for loops

function foo() {
  var j;
  let i = 3;
  for (let i = 0; i < 10; i++) {
    j = i;
  }
  return j;
}

function bar() {
  let list = [1, 2, 3];
  var j;
  let i = 3;
  for (const i of list) {
    j = i;
  }
  return j + i;
}

function baz() {
  const obj = { a: 1, b: 2, c: 3 };
  var j;
  let k = 3;
  for (let [k, v] of Object.entries(obj)) {
    j = v;
    console.log(k);
  }
  return j + k;
}
