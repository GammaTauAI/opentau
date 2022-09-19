const isNumber = function(str) {
  let i = 0;
  let s = str;
    for (; i < s.length && " " == s[i]; ++i);
    if ("+" == s[i] || "-" == s[i]) ++i;
    let digit = false,
    dot = false,
    exp = false;
  for (; i < s.length; ++i) {
    if ("." == s[i] && !dot)
            dot = true;
    else if ("e" == s[i] && !exp && digit) {
                  dot = exp = true;
      if (i + 1 < s.length && ("+" == s[i + 1] || "-" == s[i + 1])) ++i;
      if (i + 1 >= s.length || !(s[i + 1] >= "0" && s[i + 1] <= "9"))
        return false;
    } else if (s[i] >= "0" && s[i] <= "9") digit = true;
    else break;
  }
    for (; i < s.length && " " == s[i]; ++i);
  return digit && i == s.length;
};
