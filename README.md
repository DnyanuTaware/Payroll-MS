# Payroll Management system

>How to set up a project
1.clicking on <>code button on github download the zip file and extract its contents into other folder
2.Open this folder in VS code
3.In server.js set user ,password and database to your username  ,password and database_name
    >>first create a database with the name database_name as follows (run this commands one by one in mysql command line client)
    >>create database database_name;
    >>use database_name;

    >>CREATE TABLE Employee (
    employee_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    dob DATE,
    age INT,
    address VARCHAR(255),
    contact VARCHAR(20),
    employee_position VARCHAR(50),
    email VARCHAR(100)
);

    >>CREATE TABLE Paygrade (
    paygrade_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    basic_salary DECIMAL(10, 2),
    bonus DECIMAL(10, 2),
    pf DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);

    >>CREATE TABLE Payroll (
    payroll_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    hra DECIMAL(10, 2),
    ma DECIMAL(10, 2),
    ta DECIMAL(10, 2),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);

    >>CREATE TABLE Payslip (
    payslip_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    total_earning DECIMAL(10, 2),
    total_deduction DECIMAL(10, 2),
    net_salary DECIMAL(10, 2),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);


4.Run server.js by using following  command in integrated terminal 
    >>node server.js
5.If you still having issue like modules not found then run the following command in integrated terminal of vs code
    >>install express mysql body-parser cors
6.now agin run the command
    >>node server.js 
    To run the backend...it will give u a msg database connected if no issues are there
7.then to run the frontend 
    >>install live server
    >>run login.html by clicking on 'Go live' option(present at bottom right of window)
    >>use username=Project
          password=password123
8.Finally go with your project inputs
