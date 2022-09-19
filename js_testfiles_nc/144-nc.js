const UndergroundSystem = function() {
  this.h = new Map()
  this.routeMap = new Map()
};
UndergroundSystem.prototype.checkIn = function(id, stationName, t) {
  this.h.set(id, [stationName, t])
};
UndergroundSystem.prototype.checkOut = function(id, stationName, t) {
  const [sn, st] = this.h.get(id)
  this.h.delete(id)
  const route = `${sn},${stationName}`
  const duration = t - st
  const [totalTime, totalValue] = this.routeMap.get(route) || ([0, 0])
  this.routeMap.set(route, [totalTime + duration, totalValue + 1])
};
UndergroundSystem.prototype.getAverageTime = function(startStation, endStation) {
  const k = `${startStation},${endStation}`
  const [time, number] = this.routeMap.get(k)
  return time / number
};
