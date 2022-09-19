const MagicDictionary = function(dict) {
  this.dict = [];
};
MagicDictionary.prototype.buildDict = function(dict) {
  this.dict = dict;
};
MagicDictionary.prototype.search = function(word) {
  return check(word, this.dict);
};
function check(str, arr) {
  let el;
  for (let i = 0; i < arr.length; i++) {
    el = arr[i];
    if (el.length === str.length && oneCharDiff(el, str)) {
      return true;
    }
  }
  return false;
}
function oneCharDiff(str1, str2) {
  let diff = 0;
  for (let i = 0; i < str1.length; i++) {
    if (str1[i] !== str2[i]) {
      diff += 1;
    }
  }
  return diff === 1 ? true : false;
}
