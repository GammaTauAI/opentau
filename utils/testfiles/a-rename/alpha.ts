function f() {
  let x = 1;
  let y = x;

  function g() {
    let x = 2;
    let y = x;
    console.log(x);
    console.log(y);
  }

  console.log(x);
  console.log(y);
}

// correct alpha renaming
/*
function f_0() {
  let x_1 = 1;
  let y_2 = x_1;

  function g_3() {
    let x_4 = 2;
    let y_5 = x_4;
    console.log(x_4);
    console.log(y_5);
  }

  console.log(x_1);
  console.log(y_2);
}
*/
