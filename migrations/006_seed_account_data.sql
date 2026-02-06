-- Clear existing data and seed distinct data for each account
-- Run this in your Neon database console

-- Step 1: Clear existing data
DELETE FROM expense_breakdowns;
DELETE FROM expense_receipts_new;
DELETE FROM expenses_new;
DELETE FROM budget_breakdowns;
DELETE FROM budgets;

-- Step 2: Insert ACBS account budgets
INSERT INTO budgets (department_id, category_id, name, amount, description, source, payment_method, budget_date, fiscal_year, status, account_type, created_by)
VALUES 
  (1, 1, 'ACBS Workshop Equipment', 50000, 'Equipment for association workshops', 'Department Fund', 'online', '2025-01-15', '2024-2025', 'active', 'acbs', 1),
  (1, 2, 'ACBS Annual Fest', 75000, 'Annual association fest budget', 'Sponsorship', 'cash', '2025-02-20', '2024-2025', 'active', 'acbs', 1),
  (1, 3, 'ACBS Guest Lectures', 25000, 'Expert guest lectures budget', 'College Fund', 'cheque', '2025-03-10', '2024-2025', 'active', 'acbs', 1);

-- Step 3: Insert Innovision account budgets
INSERT INTO budgets (department_id, category_id, name, amount, description, source, payment_method, budget_date, fiscal_year, status, account_type, created_by)
VALUES 
  (1, 1, 'Innovision Main Stage', 150000, 'Main stage setup and equipment', 'Sponsorship', 'online', '2025-02-15', '2024-2025', 'active', 'innovision', 1),
  (1, 2, 'Innovision Marketing', 45000, 'Marketing and promotion budget', 'Event Fund', 'cash', '2025-02-01', '2024-2025', 'active', 'innovision', 1),
  (1, 3, 'Innovision Prizes', 80000, 'Competition prizes and awards', 'Sponsorship', 'cheque', '2025-03-01', '2024-2025', 'active', 'innovision', 1),
  (1, 4, 'Innovision Food & Hospitality', 60000, 'Catering and hospitality', 'Registration Fees', 'cash', '2025-02-28', '2024-2025', 'active', 'innovision', 1);

-- Step 4: Insert Infrastructure account budgets
INSERT INTO budgets (department_id, category_id, name, amount, description, source, payment_method, budget_date, fiscal_year, status, account_type, created_by)
VALUES 
  (1, 1, 'Lab Equipment Upgrade', 200000, 'Computer lab equipment upgrade', 'College Fund', 'online', '2025-01-20', '2024-2025', 'active', 'infrastructure', 1),
  (1, 2, 'Furniture Replacement', 100000, 'Classroom furniture replacement', 'Maintenance Fund', 'cheque', '2025-02-10', '2024-2025', 'active', 'infrastructure', 1),
  (1, 3, 'Network Infrastructure', 75000, 'Network and internet upgrades', 'IT Budget', 'online', '2025-03-15', '2024-2025', 'active', 'infrastructure', 1);

-- Step 5: Insert ACBS expenses
INSERT INTO expenses_new (department_id, category_id, name, amount, description, spender, payment_method, expense_date, status, account_type, created_by)
VALUES 
  (1, 1, 'Arduino Kits Purchase', 15000, 'Arduino kits for IoT workshop', 'Mr. Sharma', 'online', '2025-01-18', 'approved', 'acbs', 1),
  (1, 1, 'Raspberry Pi Boards', 12000, 'Raspberry Pi for embedded systems workshop', 'Mr. Sharma', 'cash', '2025-01-22', 'approved', 'acbs', 1),
  (1, 2, 'Banner Printing', 5000, 'Banners for ACBS fest', 'Ms. Patil', 'cash', '2025-02-18', 'pending', 'acbs', 1);

-- Step 6: Insert Innovision expenses
INSERT INTO expenses_new (department_id, category_id, name, amount, description, spender, payment_method, expense_date, status, account_type, created_by)
VALUES 
  (1, 1, 'Stage Lighting', 35000, 'LED lighting for main stage', 'Event Team', 'online', '2025-02-10', 'approved', 'innovision', 1),
  (1, 1, 'Sound System Rental', 45000, 'Sound system for 3 days', 'Event Team', 'cheque', '2025-02-12', 'approved', 'innovision', 1),
  (1, 2, 'Social Media Ads', 15000, 'Instagram and Facebook promotion', 'Marketing Team', 'online', '2025-01-25', 'approved', 'innovision', 1),
  (1, 3, 'Winner Trophies', 20000, 'Custom trophies for competitions', 'Prize Committee', 'cash', '2025-02-25', 'pending', 'innovision', 1),
  (1, 4, 'Catering Day 1', 18000, 'Food for participants day 1', 'Hospitality Team', 'cash', '2025-02-28', 'pending', 'innovision', 1);

-- Step 7: Insert Infrastructure expenses
INSERT INTO expenses_new (department_id, category_id, name, amount, description, spender, payment_method, expense_date, status, account_type, created_by)
VALUES 
  (1, 1, 'Dell Monitors x20', 80000, '20 new monitors for lab', 'IT Admin', 'online', '2025-01-25', 'approved', 'infrastructure', 1),
  (1, 1, 'HP Keyboards & Mice', 15000, 'Peripheral replacements', 'IT Admin', 'cash', '2025-01-28', 'approved', 'infrastructure', 1),
  (1, 2, 'Ergonomic Chairs x30', 45000, 'Ergonomic chairs for computer lab', 'Purchase Officer', 'cheque', '2025-02-05', 'approved', 'infrastructure', 1),
  (1, 3, 'Cisco Switch', 25000, 'Network switch upgrade', 'Network Admin', 'online', '2025-03-01', 'pending', 'infrastructure', 1);

-- Verify data counts
SELECT account_type, COUNT(*) as budget_count FROM budgets GROUP BY account_type;
SELECT account_type, COUNT(*) as expense_count, SUM(amount) as total_amount FROM expenses_new GROUP BY account_type;
