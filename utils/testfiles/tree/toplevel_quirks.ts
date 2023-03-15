const myTopLevelVar = 3;

function f(x) {
  function g(y) {
    return x + y;
  }
  return g(2);
}

const topLevelArrowWithoutBlock = (x) => x + 1;

const topLevelArrowWithBlock = (x) => {
  return x + 1;
};
