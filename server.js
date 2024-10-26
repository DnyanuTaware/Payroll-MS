const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'taware',
    database: 'pay3'
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Database connected.");
});

// Route to add an employee
app.post('/api/employee', (req, res) => {
    const { name, dob, age, address, contact, employee_position, email, basic_salary, bonus } = req.body;

    // Calculate PF and Tax based on basic_salary
    const pf = basic_salary * 0.12; // 12% PF
    const tax = basic_salary > 50000 ? basic_salary * 0.1 : basic_salary * 0.05; // 5% or 10% tax
    const hra = 10000;
    const ma = 3000;
    const ta = 2000;
            
    // Calculate values
                
    const totalEarnings = basic_salary + bonus + hra + ma + ta;
    const totalDeductions = pf + tax;
    const netSalary = totalEarnings - totalDeductions;
            

    // Insert into Employee table
    const employeeQuery = `INSERT INTO Employee (name, dob, age, address, contact, employee_position, email)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(employeeQuery, [name, dob, age, address, contact, employee_position, email], (err, result) => {
        if (err) {
            console.error("Error inserting employee:", err);
            return res.status(500).send("Error inserting employee.");
        }
    
        const employee_id = result.insertId;

        // Insert into Paygrade table
        const paygradeQuery = `INSERT INTO Paygrade (employee_id, basic_salary, bonus, pf, tax) VALUES (?, ?, ?, ?, ?)`;
        db.query(paygradeQuery, [employee_id, basic_salary, bonus, pf, tax], (err, result) => {
            if (err) {
                console.error("Error inserting paygrade:", err);
                return res.status(500).send("Error inserting paygrade.");
            }

        // Insert into Payroll table
        const payrollQuery = `INSERT INTO Payroll (employee_id, hra, ma, ta) VALUES (?, ?, ?, ?)`;
        db.query(payrollQuery, [employee_id, hra, ma, ta], (err, result) => {
            if (err) {
                console.error("Error inserting paygrade:", err);
                return res.status(500).send("Error inserting paygrade.");
            }

        // Insert into payslip table
        const payslipQuery = `INSERT INTO Payslip (employee_id, total_earning, total_deduction, net_salary) VALUES (?, ?, ?, ?)`;
        db.query(payslipQuery, [employee_id, totalEarnings, totalDeductions, netSalary], (err, result) => {
            if (err) {
                console.error("Error inserting paygrade:", err);
                return res.status(500).send("Error inserting paygrade.");
            }

            res.send('Employee and paygrade details added successfully');
        });
    });
    });
    });
});
// Route to fetch combined employee and paygrade details
app.get('/api/employee-paygrade', (req, res) => {
    const query = `
        SELECT 
            e.employee_id,
            e.name,
            e.age,
            e.employee_position,
            e.email,
            e.contact,
            pg.basic_salary,
            pg.bonus,
            pg.pf,
            pg.tax
        FROM Employee e
        JOIN Paygrade pg ON e.employee_id = pg.paygrade_id; -- Adjust based on your actual foreign key
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database query failed');
        }
        res.json(results);
    });
});
// API to fetch a single employee by ID
app.get('/api/employee/:id', (req, res) => {
    const employeeId = req.params.id;

    const sql = `
        SELECT 
            e.employee_id,
            e.name,
            e.address,
            e.contact,
            e.employee_position,
            e.email,
            pg.basic_salary,
            pg.bonus
        FROM Employee e
        JOIN Paygrade pg ON e.employee_id = pg.employee_id
        WHERE e.employee_id = ?`;

    db.query(sql, [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching employee:', err);
            res.status(500).json({ error: 'Failed to fetch employee' });
        } else if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ error: 'Employee not found' });
        }
    });
});

// API to update an employee by ID
// API to update an employee by ID
app.put('/api/employee/:id', (req, res) => {
    const employeeId = req.params.id;
    const { name, address, contact, employee_position, email, basic_salary, bonus } = req.body;
    const hra = 10000;
    const ma = 3000;
    const ta = 2000;
            
    // Calculate updated PF and Tax based on basic_salary
    const pf = basic_salary * 0.12;
    const tax = basic_salary > 50000 ? basic_salary * 0.1 : basic_salary * 0.05;
    const totalEarnings= bonus + hra + ta + ma + basic_salary;
    const totalDeductions= pf + tax;
    const netSalary=totalEarnings - totalDeductions;

    // Start a transaction to ensure atomicity
    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: 'Failed to start database transaction' });
        }

        // Update the Employee table
        const employeeSql = `
            UPDATE Employee 
            SET 
                name = ?, 
                address = ?, 
                contact = ?, 
                employee_position = ?, 
                email = ? 
            WHERE employee_id = ?`;

        db.query(employeeSql, [name, address, contact, employee_position, email, employeeId], (err, employeeResult) => {
            if (err) {
                console.error('Error updating employee:', err);
                return db.rollback(() => {
                    res.status(500).json({ error: 'Failed to update employee' });
                });
            }

            // Update the Paygrade table
            const paygradeSql = `
                UPDATE Paygrade 
                SET 
                    basic_salary = ?, 
                    bonus = ?, 
                    pf = ?, 
                    tax = ? 
                WHERE employee_id = ?`;

            db.query(paygradeSql, [basic_salary, bonus, pf, tax, employeeId], (err, paygradeResult) => {
                if (err) {
                    console.error('Error updating paygrade:', err);
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Failed to update paygrade' });
                    });
                }
            // Update the Payslip table
            const payslipSql = `
            UPDATE Payslip 
            SET 
                total_earning = ?, 
                total_deduction = ?, 
                net_salary = ?
                
            WHERE employee_id = ?`;

        db.query(payslipSql, [totalEarnings, totalDeductions, netSalary, employeeId], (err, payslipResult) => {
            if (err) {
                console.error('Error updating paygrade:', err);
                return db.rollback(() => {
                    res.status(500).json({ error: 'Failed to update payslip' });
                });
            }

                // Commit the transaction if all queries succeed
                db.commit(err => {
                    if (err) {
                        console.error('Error committing transaction:', err);
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Failed to commit transaction' });
                        });
                    }

                    res.json({ message: 'Employee and paygrade updated successfully' });
                });
            });
        });
    });
});
});
/*
// API to delete an employee by ID
app.delete('/api/employee/:id', (req, res) => {
    const employeeId = req.params.id;

    // First, delete the corresponding record from the Paygrade table
    const deletePaygradeSql = `DELETE FROM Paygrade WHERE employee_id = ?`;
    db.query(deletePaygradeSql, [employeeId], (err, paygradeResult) => {
        if (err) {
            console.error('Error deleting paygrade record:', err);
            return res.status(500).json({ error: 'Failed to delete paygrade record' });
        }

        // Then, delete the record from the Employee table
        const deleteEmployeeSql = `DELETE FROM Employee WHERE employee_id = ?`;
        db.query(deleteEmployeeSql, [employeeId], (err, employeeResult) => {
            if (err) {
                console.error('Error deleting employee:', err);
                return res.status(500).json({ error: 'Failed to delete employee' });
            }

            res.json({ message: 'Employee deleted successfully' });
        });
    });
});
/*
// Route to add payroll and payslip data
app.post('/api/payslip', (req, res) => {
    const { employee_id, basic_salary, bonus } = req.body;

    // Define HRA, MA, and TA (you can adjust these as per your logic)
    const hra = 10000; // Example fixed value
    const ma = 3000;   // Example fixed value
    const ta = 2000;   // Example fixed value

    // Calculate total earnings
    const totalEarnings = basic_salary + bonus + hra + ma + ta;

    // Insert into Payroll table
    const payrollQuery = `
        INSERT INTO Payroll (employee_id, hra, ma, ta)
        VALUES (?, ?, ?, ?)`;

    db.query(payrollQuery, [employee_id, hra, ma, ta], (err, payrollResult) => {
        if (err) {
            console.error("Error inserting payroll:", err);
            return res.status(500).send("Error inserting payroll.");
        }

        const payroll_id = payrollResult.insertId; // Get the inserted payroll ID

        // Calculate deductions
        const pf = basic_salary * 0.12; // Example: 12% of basic salary
        const tax = basic_salary * 0.1;  // Example: 10% of basic salary
        const totalDeductions = pf + tax;

        // Calculate net salary
        const netSalary = totalEarnings - totalDeductions;

        // Insert into Payslip table
        const payslipQuery = `
            INSERT INTO Payslip (employee_id, total_earning, total_deduction, net_salary)
            VALUES (?, ?, ?, ?)`;

        db.query(payslipQuery, [employee_id, totalEarnings, totalDeductions, netSalary], (err, payslipResult) => {
            if (err) {
                console.error("Error inserting payslip:", err);
                return res.status(500).send("Error inserting payslip.");
            }

            res.send('Payslip added successfully.');
        });
    });
});
*/

// Route to delete employee and related records
app.delete('/api/employee/:id', (req, res) => {
    const employeeId = req.params.id;

    // First, delete the corresponding record from the Paygrade table
    const deletePaygradeSql = `DELETE FROM Paygrade WHERE employee_id = ?`;
    db.query(deletePaygradeSql, [employeeId], (err, paygradeResult) => {
        if (err) {
            console.error('Error deleting paygrade record:', err);
            return res.status(500).json({ error: 'Failed to delete paygrade record' });
        }


    // First, delete the corresponding payslip records
    const deletePayslipSql = `DELETE FROM Payslip WHERE employee_id = ?`;
    db.query(deletePayslipSql, [employeeId], (err) => {
        if (err) {
            console.error('Error deleting payslip record:', err);
            return res.status(500).json({ error: 'Failed to delete payslip record' });
        }

        // Then, delete the corresponding payroll records
        const deletePayrollSql = `DELETE FROM Payroll WHERE employee_id = ?`;
        db.query(deletePayrollSql, [employeeId], (err) => {
            if (err) {
                console.error('Error deleting payroll record:', err);
                return res.status(500).json({ error: 'Failed to delete payroll record' });
            }

            // Finally, delete the employee record
            const deleteEmployeeSql = `DELETE FROM Employee WHERE employee_id = ?`;
            db.query(deleteEmployeeSql, [employeeId], (err) => {
                if (err) {
                    console.error('Error deleting employee:', err);
                    return res.status(500).json({ error: 'Failed to delete employee' });
                }

                res.json({ message: 'Employee and related records deleted successfully' });
            });
        });
    });
});
});



// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
