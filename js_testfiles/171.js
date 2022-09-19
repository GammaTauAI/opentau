




SELECT max(Salary) AS SecondHighestSalary
FROM Employee
WHERE Salary < (SELECT max(Salary) FROM Employee)




SELECT IFNULL(
    (SELECT DISTINCT Salary 
    FROM Employee 
    ORDER BY Salary DESC
    LIMIT 1 OFFSET 1)
    , NULL) AS SecondHighestSalary

