// tests destructuring via let
function h(obj) {
  const {
    a,
    b_prop: b_init,
    c: { d },
    e: [f, g],
    h: {
      i: { j },
    },
  } = obj;
  console.log(a + b_init + d + f + g + j);
}

// tests object parameter destructuring with inner function
function g2({
  a,
  b_prop: b_init,
  c: { d },
  e: [f, g],
  h: {
    i: { j },
  },
}) {
  console.log(a + b_init + d + f + g + j);
}

// NOW WITH LISTS

// tests destructuring via let
function h2(list) {
  const [a, b, { c }, [d, e], { f: { g } }] = list;
  console.log(a + b + c + d + e + g);
}

// tests object parameter destructuring with inner function
function g3([a, b, { c }, [d, e], { f: { g } }]) {
  console.log(a + b + c + d + e + g);
}


