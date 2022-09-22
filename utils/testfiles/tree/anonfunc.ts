// tests anonymous functions
const anon = function () {
  return 1;
};

const anonArrow = () => {
  return 1;
};

const anonDeep = function () {
  const x = 4;

  const bleh = function () {
    return x;
  };

  return (function (y) {
    return x + y;
  })(bleh() + 2);
};
