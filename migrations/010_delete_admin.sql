-- Reassign records from Admin to HOD to satisfy foreign key constraints

-- 1. Budgets (Unified)
UPDATE budgets 
SET created_by = (SELECT id FROM users WHERE email = 'hod@rscoe.edu.in') 
WHERE created_by = (SELECT id FROM users WHERE email = 'admin@rscoe.edu.in');

-- 2. Expenses New (Unified)
UPDATE expenses_new 
SET created_by = (SELECT id FROM users WHERE email = 'hod@rscoe.edu.in') 
WHERE created_by = (SELECT id FROM users WHERE email = 'admin@rscoe.edu.in');

-- 3. Budget Plans (Proposed)
UPDATE budget_plans 
SET created_by = (SELECT id FROM users WHERE email = 'hod@rscoe.edu.in') 
WHERE created_by = (SELECT id FROM users WHERE email = 'admin@rscoe.edu.in');

-- 4. Budget Allotments
UPDATE budget_allotments 
SET approved_by = (SELECT id FROM users WHERE email = 'hod@rscoe.edu.in') 
WHERE approved_by = (SELECT id FROM users WHERE email = 'admin@rscoe.edu.in');

-- 5. Sub-Budgets (from 003.sql)
UPDATE sub_budgets
SET created_by = (SELECT id FROM users WHERE email = 'hod@rscoe.edu.in')
WHERE created_by = (SELECT id FROM users WHERE email = 'admin@rscoe.edu.in');

-- 6. Expenses (Old/Standard) - check both created_by and approved_by
UPDATE expenses 
SET created_by = (SELECT id FROM users WHERE email = 'hod@rscoe.edu.in') 
WHERE created_by = (SELECT id FROM users WHERE email = 'admin@rscoe.edu.in');

UPDATE expenses 
SET approved_by = (SELECT id FROM users WHERE email = 'hod@rscoe.edu.in') 
WHERE approved_by = (SELECT id FROM users WHERE email = 'admin@rscoe.edu.in');

-- 7. Expense Receipts
UPDATE expense_receipts 
SET uploaded_by = (SELECT id FROM users WHERE email = 'hod@rscoe.edu.in') 
WHERE uploaded_by = (SELECT id FROM users WHERE email = 'admin@rscoe.edu.in');

-- 8. Deposits (ACBS)
UPDATE deposits 
SET created_by = (SELECT id FROM users WHERE email = 'hod@rscoe.edu.in') 
WHERE created_by = (SELECT id FROM users WHERE email = 'admin@rscoe.edu.in');

-- 9. Audit Logs (Optional, usually SET NULL but safer to update)
UPDATE audit_logs 
SET user_id = (SELECT id FROM users WHERE email = 'hod@rscoe.edu.in') 
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@rscoe.edu.in');

-- Delete the admin user account
DELETE FROM users WHERE email = 'admin@rscoe.edu.in';
