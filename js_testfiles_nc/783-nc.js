const ParkingSystem = function(big, medium, small) {
  this['3'] = small
  this['2'] = medium
  this['1'] = big
};
ParkingSystem.prototype.addCar = function(carType) {
  this[carType]--
  if(this[carType] < 0) {
    this[carType] = 0
    return false
  }
  return true
};
