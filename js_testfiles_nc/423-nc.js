const Log = function(id, timeArgs) {
  this.id = id;
  this.timeArgs = timeArgs;
};
const LogSystem = function() {
  this.logs = [];
};
LogSystem.prototype.put = function(id, timestamp) {
  const args = timestamp.split(":");
  this.logs.push(new Log(id, args));
};
LogSystem.prototype.retrieve = function(s, e, gra) {
  const gransarr = ["Year", "Month", "Day", "Hour", "Minute", "Second"];
  const idx = gransarr.indexOf(gra);
  const sargs = s.split(":").slice(0, idx + 1);
  const eargs = e.split(":").slice(0, idx + 1);
  const sdate = new Date(...sargs).getTime();
  const edate = new Date(...eargs).getTime();
  const set = [];
  this.logs.forEach(function(item) {
    const itemArgs = item.timeArgs.slice(0, idx + 1);
    const itemTime = new Date(...itemArgs).getTime();
    if (itemTime >= sdate && itemTime <= edate) {
      set.push(item.id);
    }
  });
  return set;
};
