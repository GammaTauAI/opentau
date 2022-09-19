const longestSubsequenceRepeatedK = function(s, k) {
  const n = s.length, a = 'a'.charCodeAt(0)
  let res = ''
  const q = ['']
  while(q.length) {
    const size = q.length
    for(let i = 0; i < size; i++) {
      const cur = q.shift()
      for(let j = 0; j < 26; j++) {
        const next = cur + String.fromCharCode(a + j)
        if(isSub(s, next, k)) {
          res = next
          q.push(next)
        }
      }
    }
  }
  return res
  function isSub(s, p, k) {
    let repeated = 0
    for(let i = 0, j = 0, n = s.length, m = p.length; i < n; i++) {
      if(s[i] === p[j]) {
        j++
        if(j === m) {
          repeated++
          j = 0
          if(repeated === k) {
            return true
          }
        }
      }
    }
    return false
  }
};
var longestSubsequenceRepeatedK = function(s, k) {
        const maxLen = Math.floor(s.length / k);
            const charCount = new Map();
    const possibleChars = []
    for (const char of s) {
        if (charCount.has(char)) {
            charCount.set(char, charCount.get(char) + 1);
        } else {
            charCount.set(char, 1);
        }
    }
    for (const char of charCount.keys()) {
        if (charCount.get(char) >= k) {
            possibleChars.push(char);
        }
    }
        let ans = "";
    dfs("");
    return ans;
        function dfs(seq) {
                if (countRepeats(seq) < k) {
            return;
        }
                if (seq.length > ans.length || (seq.length === ans.length && seq > ans)) {
            ans = seq;
        }
                if (seq.length < maxLen) {
            for (const char of possibleChars) {
                dfs(seq + char);
            }
        }
    }
        function countRepeats(seq) {
                if (!seq) {
            return k;
        }
        let repeats = 0;
        let seqIdx = 0;
        for (const char of s) {
            if (char === seq[seqIdx]) {
                seqIdx += 1;
                if (seqIdx >= seq.length) {
                    seqIdx = 0;
                    repeats += 1;
                    if (repeats >= k) {
                        break;
                    }
                }
            }
        }
        return repeats;
    } 
};
