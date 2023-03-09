import axios from "axios";

// Tests if simple-scoped objects generate the right types
function f(obj) {
  console.log(obj.a + obj.b);

  function g(obj_2) {
    console.log(obj_2.d + obj_2.e);
  }

  g({ d: 1, e: 2 });

  console.log(obj.d.e);

  obj.d.e.f;

  obj.c(1, obj.d.e, 3);
  obj.d.m(obj, 2);
}

/*
// obj
interface _name_ {
  a: _hole_;
  b: _hole_;
  c: _hole_;
  d: {
    e: {
      f: _hole_;
    }
    m: _hole_;
  }
}

// obj_2
interface _name_ {
  d: _hole_;
  e: _hole_;
}
 */
