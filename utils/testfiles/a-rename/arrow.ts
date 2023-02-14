
const arrowFunc = (a: number, b: number): number => {
  const c = a + b;
  console.log(c);
  console.log(a);
  console.log(b);
  return c;
}

const normalFunc = function (a: number, b: number): number {
  const c = a + b;
  console.log(c);
  console.log(a);
  console.log(b);
  return c;
}

function normalFunc2(a: number, b: number): number {
  const c = a + b;
  console.log(c);
  console.log(a);
  console.log(b);
  return c;
}
