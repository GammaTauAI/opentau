const countSegments = function(s) {
    if(s.trim() === '') return 0
    return s.trim().split(' ').filter(el => el !== '').length
};
