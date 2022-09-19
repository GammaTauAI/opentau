




SELECT id, name FROM Students
WHERE department_id not in (SELECT id from Departments);

