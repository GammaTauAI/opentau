




SELECT employee_id, 
    COUNT(team_id) OVER(PARTITION BY team_id) AS team_size
FROM Employee;

