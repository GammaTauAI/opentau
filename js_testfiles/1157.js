









const intersection = function(nums1, nums2) {
  const obj = {};
  nums1.forEach(i => (obj[i] = true));

  return nums2.filter(j => {
    if (obj[j]) {
      delete obj[j];
      return true;
    }
    return false;
  });
};

