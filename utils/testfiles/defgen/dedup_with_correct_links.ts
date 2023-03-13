function dedupWithCorrectLinks(obj) {
  console.log(obj.firstName);
  console.log(obj.lastName);
  console.log(obj.firstName.two);
  console.log(obj.firstName.one);
  console.log(obj.lastName.one);
  console.log(obj.lastName.two);
}

/*
interface _hole_0 {
    one: _hole_;
    two: _hole_;
};

interface _hole_ {
  firstName: _hole_0;
  lastName: _hole_0;
}
*/
