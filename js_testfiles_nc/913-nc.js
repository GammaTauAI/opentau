const GetImportance = function (employees, id) {
  const map = {}
  employees.forEach((employee) => {
    map[employee.id] = employee
  })
  const s = [id]
  let importance = 0
  while (s.length) {
    let current = map[s.pop()]
    importance += current.importance
    if (current.subordinates.length) {
      s.push(...current.subordinates.reverse())
    }
  }
  return importance
}
