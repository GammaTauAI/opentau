const dayOfTheWeek = function(day, month, year) {
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const date = new Date(year,month-1,day).getDay();
  return weekdays[date];
};
