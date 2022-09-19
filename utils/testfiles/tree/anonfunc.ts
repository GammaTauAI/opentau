// tests anonymous functions
const anon = function () {
  return 1;
};

const anonDeep = function () {
  const x = 4;
  return (function (y) {
    return x + y;
  })(x + 2);
};
