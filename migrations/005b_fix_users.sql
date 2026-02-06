-- Final user setup for multi-account system
-- 5 accounts: Admin, HOD, ACBS Staff, Innovision Staff, Infrastructure Staff (existing staff@rscoe.edu.in)

-- Step 1: Reset the sequence to avoid conflicts
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM users), false);

-- Step 2: Delete any conflicting accounts (Rahul Sharma old staff, and new staff emails if they exist)
DELETE FROM users WHERE email IN ('acbs@rscoe.edu.in', 'innovision@rscoe.edu.in', 'infrastructure@rscoe.edu.in');

-- Step 3: Update existing staff@rscoe.edu.in to be Infrastructure account
UPDATE users 
SET account_type = 'infrastructure', name = 'Infrastructure Staff'
WHERE email = 'staff@rscoe.edu.in';

-- Step 4: Add ACBS and Innovision staff accounts
INSERT INTO users (department_id, name, email, password_hash, role, account_type, is_active) 
VALUES
  (1, 'ACBS Staff', 'acbs@rscoe.edu.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.HQgZU0j5MqVqPi', 'staff', 'acbs', true);

INSERT INTO users (department_id, name, email, password_hash, role, account_type, is_active) 
VALUES
  (1, 'Innovision Staff', 'innovision@rscoe.edu.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.HQgZU0j5MqVqPi', 'staff', 'innovision', true);

-- Step 5: Verify final accounts
SELECT id, name, email, role, account_type FROM users ORDER BY role, id;
