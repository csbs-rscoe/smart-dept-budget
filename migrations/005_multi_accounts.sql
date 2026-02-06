-- Multi-Account System Migration
-- Adds account_type column for data isolation between ACBS, Innovision, and Infrastructure

-- Create account type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type_enum') THEN
    CREATE TYPE account_type_enum AS ENUM ('acbs', 'innovision', 'infrastructure');
  END IF;
END $$;

-- Add account_type column to budgets table
ALTER TABLE budgets 
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'acbs';

-- Add account_type column to expenses_new table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses_new') THEN
    ALTER TABLE expenses_new ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'acbs';
  END IF;
END $$;

-- Add account_type column to expenses table
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'acbs';

-- Add account_type column to budget_breakdowns table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_breakdowns') THEN
    ALTER TABLE budget_breakdowns ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'acbs';
  END IF;
END $$;

-- Add account_type column to activity_events table
ALTER TABLE activity_events 
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'acbs';

-- Add account_type column to users table (for staff accounts)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20);

-- Add optional budget date range columns
ALTER TABLE budgets 
  ADD COLUMN IF NOT EXISTS budget_date_from DATE,
  ADD COLUMN IF NOT EXISTS budget_date_to DATE;

-- Create indexes for account_type filtering
CREATE INDEX IF NOT EXISTS idx_budgets_account_type ON budgets(account_type);
CREATE INDEX IF NOT EXISTS idx_expenses_account_type ON expenses(account_type);

-- Create three new staff users for each account type
-- Passwords: ACBS@123, Innovision@123, Staff@123
-- Using bcrypt hash with salt rounds 12 (same as existing users)

-- Delete existing staff accounts with these emails if they exist (for re-runs)
DELETE FROM users WHERE email IN ('acbs@rscoe.edu.in', 'innovision@rscoe.edu.in', 'infrastructure@rscoe.edu.in');

-- Insert new staff users  
-- Passwords will be set by seed script: ACBS@123, Innovision@123, Staff@123
-- Using placeholder hash initially (same as Admin@123), seed script will update with correct hashes
INSERT INTO users (department_id, name, email, password_hash, role, account_type, is_active) VALUES
  (1, 'ACBS Staff', 'acbs@rscoe.edu.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.HQgZU0j5MqVqPi', 'staff', 'acbs', true),
  (1, 'Innovision Staff', 'innovision@rscoe.edu.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.HQgZU0j5MqVqPi', 'staff', 'innovision', true),
  (1, 'Infrastructure Staff', 'infrastructure@rscoe.edu.in', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.HQgZU0j5MqVqPi', 'staff', 'infrastructure', true);

-- Update existing staff user to have ACBS account type
UPDATE users SET account_type = 'acbs' WHERE email = 'staff@rscoe.edu.in' AND account_type IS NULL;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Multi-account migration completed successfully';
END $$;
