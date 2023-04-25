// test comment for globals
let greeting = "Hello";
let suffix = "!";
// test comment after globals

// test comment for hello
const hello = (name) => {
  // test comment inside hello
  return greeting + " " + name;
  // test comment after return greeting + " " + name;
};


// test comment for helloGen
function helloGen(name) {
  // test comment inside helloGen, for helloHelper
  const helloHelper = () => {
    // test comment inside helloHelper
    let res = hello(name) + suffix;
    return res;
  };
  // test comment after helloHelper
  return helloHelper;
  // test comment after return helloHelper
}
