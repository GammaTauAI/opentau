const rand10 = function() {
  let result = 40
  while (result >= 40) {
    result = 7 * (rand7() - 1) + (rand7() - 1)
  }
  return (result % 10) + 1
}
const rand10 = function() {
  let tmp = 40
  while(tmp >= 40) tmp = 7 * (rand7() - 1) + (rand7() - 1)
  return tmp % 10 + 1
};
