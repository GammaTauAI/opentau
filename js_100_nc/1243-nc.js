const nextPermutation = function(nums) {
  const n = nums.length
  let k
  for(let i = n - 2; i >= 0; i--) {
    if(nums[i] < nums[i + 1]) {
      k = i
      break
    }
  }
  if(k == null) {
    reverse(nums, 0, n - 1)
  } else {
    let end
    for(let i = n - 1; i >= 0; i--) {
      if(nums[i] > nums[k]) {
        end = i
        break
      }
    }
    swap(nums, k, end)
    reverse(nums, k + 1, n - 1)
  }
  function reverse(arr, start, end) {
    while(start < end) {
      swap(arr, start, end)
      start++
      end--
    }
  }
  function swap(arr, i, j) {
    ;[arr[i], arr[j]] = [arr[j], arr[i]];
  }
};
const nextPermutation = function(nums) {
    let i = nums.length - 2;
    while (i >= 0 && nums[i + 1] <= nums[i]) {
        i--;
    }
    if (i >= 0) {
        let j = nums.length - 1;
        while (j >= 0 && nums[j] <= nums[i]) {
            j--;
        }
        swap(nums, i, j);
    }
    reverse(nums, i + 1);
};
function reverse(nums, start) {
    let i = start, j = nums.length - 1;
    while (i < j) {
        swap(nums, i, j);
        i++;
        j--;
    }
}
function swap(arr, i, j) {
  arr[i] ^= arr[j];
  arr[j] ^= arr[i];
  arr[i] ^= arr[j];
}
const nextPermutation = function(nums) {
  const n = nums.length
  let start, end
  for(let i = n - 2; i >= 0; i--) {
    if(nums[i] < nums[i + 1]) {
      start = i
      break
    }
  }
  if(start == null) {
    reverse(nums, 0, n - 1)
  } else {
    for(let i = n - 1; i >= 0; i--) {
      if(nums[i] > nums[start]) {
        end = i
        break
      }
    }
    swap(nums, start, end)
    reverse(nums, start + 1, n - 1)
  }
};
function reverse(arr, start, end) {
  while(start < end) {
    swap(arr, start++, end--)
  }
}
function swap(arr, i, j) {
  const tmp = arr[i]
  arr[i] = arr[j]
  arr[j] = tmp
}
