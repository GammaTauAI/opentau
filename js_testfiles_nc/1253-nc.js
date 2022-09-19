const canAttendMeetings = function(intervals) {
  if(intervals == null || intervals.length === 0) return true
  intervals.sort((a,b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
  for (let i = 0; i < intervals.length - 1; i++) {
    if (intervals[i][1] > intervals[i+1][0]) return false;
  }
  return true;
};
