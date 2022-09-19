const containsDuplicate = function(nums) {
  const hash = {};
  for (let el of nums) {
    if (hash.hasOwnProperty(el)) {
      return true;
    } else {
      hash[el] = 1;
    }
  }
  return false;
};
