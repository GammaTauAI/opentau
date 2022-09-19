







const largestRectangleArea = function(heights) {
  let height = heights;
  if (height == null || height.length == 0) {
    return 0;
  }
  const lessFromLeft = new Array(height.length).fill(0);
  const lessFromRight = new Array(height.length).fill(0);
  lessFromRight[height.length - 1] = height.length;
  lessFromLeft[0] = -1;
  for (let i = 1; i < height.length; i++) {
    let p = i - 1;
    while (p >= 0 && height[p] >= height[i]) {
      p = lessFromLeft[p];
    }
    lessFromLeft[i] = p;
  }
  for (let i = height.length - 2; i >= 0; i--) {
    let p = i + 1;
    while (p < height.length && height[p] >= height[i]) {
      p = lessFromRight[p];
    }
    lessFromRight[i] = p;
  }
  let maxArea = 0;
  for (let i = 0; i < height.length; i++) {
    maxArea = Math.max(
      maxArea,
      height[i] * (lessFromRight[i] - lessFromLeft[i] - 1)
    );
  }
  return maxArea;
};


// another





const largestRectangleArea = function(heights) {
  if (!heights.length) return 0;
  let stack = [];
  let max = 0;
  for (let i = 0, cur, len = heights.length; i <= len; i++) {
    cur = i === len ? -1 : heights[i];
    while (stack.length && cur < heights[stack[stack.length - 1]]) {
      let index = stack.pop();
      let h = heights[index];
      let w = !stack.length ? i : i - stack[stack.length - 1] - 1;
      max = Math.max(max, h * w);
    }
    stack.push(i);
  }
  return max;
};

// another





const largestRectangleArea = function(heights) {
  heights.push(0)
  const st = [], n = heights.length
  let res = 0
  for(let i = 0; i <= n; i++) {
    while(st.length && heights[st[st.length - 1]] >= heights[i]) {
      const top = st.pop()
      const pre = st.length ? st[st.length - 1] : -1
      res = Math.max(res, heights[top] * (i - pre - 1))
    }
    st.push(i)
  }
  return res
};

