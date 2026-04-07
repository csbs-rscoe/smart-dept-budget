-- ============================================================
-- Master Migration — Fresh Install
-- Run this ONCE on a clean Neon database.
-- ============================================================

-- 0. Clean slate (safe on empty DB)
DROP TABLE IF EXISTS expense_receipts CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_receipts_new CASCADE;
DROP TABLE IF EXISTS expenses_new CASCADE;
DROP TABLE IF EXISTS sub_expenses CASCADE;
DROP TABLE IF EXISTS sub_budgets CASCADE;
DROP TABLE IF EXISTS budget_allotments CASCADE;
DROP TABLE IF EXISTS budget_plans CASCADE;
DROP TABLE IF EXISTS budget_breakdowns CASCADE;
DROP TABLE IF EXISTS expense_breakdowns CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS activity_events CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TYPE IF EXISTS account_type_enum CASCADE;

-- ============================================================
-- 1. Core Tables
-- ============================================================

-- Departments
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'hod', 'staff')),
  account_type VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Events
CREATE TABLE activity_events (
  id SERIAL PRIMARY KEY,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100),
  start_date DATE,
  end_date DATE,
  description TEXT,
  account_type VARCHAR(20) DEFAULT 'acbs',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Budget Tables
-- ============================================================

-- Budget Plans (Proposed)
CREATE TABLE budget_plans (
  id SERIAL PRIMARY KEY,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  fiscal_year VARCHAR(20) NOT NULL,
  proposed_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  justification TEXT,
  created_by INT REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, category_id, fiscal_year)
);

-- Budget Allotments
CREATE TABLE budget_allotments (
  id SERIAL PRIMARY KEY,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  fiscal_year VARCHAR(20) NOT NULL,
  allotted_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  approved_by INT REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, category_id, fiscal_year)
);

-- Budgets (Unified — main budget items)
CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  description TEXT,
  source VARCHAR(255),
  payment_method VARCHAR(50),
  budget_date DATE,
  fiscal_year VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active',
  account_type VARCHAR(20) DEFAULT 'acbs',
  budget_date_from DATE,
  budget_date_to DATE,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budgets_fiscal ON budgets(fiscal_year);
CREATE INDEX idx_budgets_account_type ON budgets(account_type);

-- Sub-Budgets
CREATE TABLE sub_budgets (
  id SERIAL PRIMARY KEY,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  fiscal_year VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  budget_type VARCHAR(50) DEFAULT 'category' CHECK (budget_type IN ('category', 'independent')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sub_budgets_department ON sub_budgets(department_id);
CREATE INDEX idx_sub_budgets_category ON sub_budgets(category_id);
CREATE INDEX idx_sub_budgets_fiscal ON sub_budgets(fiscal_year);
CREATE INDEX idx_sub_budgets_type ON sub_budgets(budget_type);

-- ============================================================
-- 3. Expense Tables
-- ============================================================

-- Expenses (Unified)
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE RESTRICT,
  event_id INT REFERENCES activity_events(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT,
  invoice_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  account_type VARCHAR(20) DEFAULT 'acbs',
  created_by INT REFERENCES users(id),
  approved_by INT REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_department ON expenses(department_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_account_type ON expenses(account_type);

-- Expenses New (alternate expense table used by some pages)
CREATE TABLE expenses_new (
  id SERIAL PRIMARY KEY,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  budget_id INT REFERENCES budgets(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  spender VARCHAR(255),
  payment_method VARCHAR(50),
  expense_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  account_type VARCHAR(20) DEFAULT 'acbs',
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_new_department ON expenses_new(department_id);
CREATE INDEX idx_expenses_new_category ON expenses_new(category_id);
CREATE INDEX idx_expenses_new_date ON expenses_new(expense_date);
CREATE INDEX idx_expenses_new_status ON expenses_new(status);
CREATE INDEX idx_expenses_new_account_type ON expenses_new(account_type);

-- Sub-Expenses
CREATE TABLE sub_expenses (
  id SERIAL PRIMARY KEY,
  expense_id INT REFERENCES expenses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sub_expenses_expense ON sub_expenses(expense_id);

-- Expense Receipts
CREATE TABLE expense_receipts (
  id SERIAL PRIMARY KEY,
  expense_id INT REFERENCES expenses(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  cloudinary_url TEXT NOT NULL,
  mime_type VARCHAR(100),
  size_bytes INT,
  uploaded_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Breakdowns (installment breakdowns for budgets)
CREATE TABLE budget_breakdowns (
  id SERIAL PRIMARY KEY,
  budget_id INT REFERENCES budgets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_breakdowns_budget ON budget_breakdowns(budget_id);

-- Expense Breakdowns (installment breakdowns for expenses)
CREATE TABLE expense_breakdowns (
  id SERIAL PRIMARY KEY,
  expense_id INT REFERENCES expenses_new(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  breakdown_date DATE,
  payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_breakdowns_expense ON expense_breakdowns(expense_id);
CREATE INDEX idx_expense_breakdowns_date ON expense_breakdowns(breakdown_date);

-- Audit Logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- 4. Additional Tables
-- ============================================================

-- Semesters
CREATE TABLE IF NOT EXISTS semesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    semester_number INTEGER NOT NULL CHECK (semester_number IN (1, 2)),
    academic_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_semester_year UNIQUE (semester_number, academic_year)
);

CREATE INDEX idx_semesters_academic_year ON semesters(academic_year);
CREATE INDEX idx_semesters_active ON semesters(is_active);

-- App Settings
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Deposits (ACBS Bank Account)
CREATE TABLE IF NOT EXISTS deposits (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deposits_date ON deposits(deposit_date);

-- ============================================================
-- 5. Search Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_expenses_vendor_search ON expenses USING gin(to_tsvector('english', vendor));
CREATE INDEX IF NOT EXISTS idx_expenses_description_search ON expenses USING gin(to_tsvector('english', coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_sub_budgets_name_search ON sub_budgets USING gin(to_tsvector('english', name));

-- ============================================================
-- 6. Seed Data — Departments
-- ============================================================

INSERT INTO departments (name, code, academic_year) VALUES
  ('Computer Science and Business Systems', 'CSBS', '2024-25');

-- ============================================================
-- 7. Seed Data — Users (Fresh)
-- ============================================================
-- Passwords (all hash to 'Admin@123' placeholder — change after first login):
--   Admin: admin@rscoe.edu.in
--   HOD:   hod@rscoe.edu.in
--   Staff: acbs@rscoe.edu.in, innovision@rscoe.edu.in, infrastructure@rscoe.edu.in

INSERT INTO users (department_id, name, email, password_hash, role, account_type, is_active) VALUES
  (1, 'System Administrator',    'admin@rscoe.edu.in',         '$2a$12$Wmklvyl7SPsWIIx.9MXAr.eMeFsMpN6RGuqZJMsAON3gQaHGZ.Qna', 'admin', null,              true),
  (1, 'Dr. Kavita Moholkar',     'hod@rscoe.edu.in',           '$2a$12$Wmklvyl7SPsWIIx.9MXAr.eMeFsMpN6RGuqZJMsAON3gQaHGZ.Qna', 'hod',   null,              true),
  (1, 'ACBS Staff',              'acbs@rscoe.edu.in',          '$2a$12$Wmklvyl7SPsWIIx.9MXAr.eMeFsMpN6RGuqZJMsAON3gQaHGZ.Qna', 'staff', 'acbs',           true),
  (1, 'Innovision Staff',        'innovision@rscoe.edu.in',    '$2a$12$Wmklvyl7SPsWIIx.9MXAr.eMeFsMpN6RGuqZJMsAON3gQaHGZ.Qna', 'staff', 'innovision',     true),
  (1, 'Infrastructure Staff',    'infrastructure@rscoe.edu.in','$2a$12$Wmklvyl7SPsWIIx.9MXAr.eMeFsMpN6RGuqZJMsAON3gQaHGZ.Qna', 'staff', 'infrastructure', true);

-- ============================================================
-- 8. Seed Data — Categories
-- ============================================================

INSERT INTO categories (name, description) VALUES
  ('Infrastructure',    'Lab setup, repairs, furniture, civil works'),
  ('Hardware',          'Computers, servers, networking equipment, peripherals'),
  ('Software',          'Licenses, subscriptions, development tools'),
  ('Workshops & FDPs',  'Faculty development programs, training sessions'),
  ('Expert Sessions',   'Guest lectures, industry talks, honorarium'),
  ('Technical Events',  'Hackathons, competitions, tech fests'),
  ('Student Activities','Club activities, student competitions, projects'),
  ('Miscellaneous',     'Stationery, printing, consumables, other expenses');

-- ============================================================
-- 9. Seed Data — Semesters
-- ============================================================

INSERT INTO semesters (name, semester_number, academic_year, start_date, end_date, is_active)
VALUES
    ('Semester 1 (2025-26)', 1, '2025-26', '2025-07-01', '2025-12-31', false),
    ('Semester 2 (2025-26)', 2, '2025-26', '2026-01-01', '2026-06-30', true)
ON CONFLICT (semester_number, academic_year) DO NOTHING;

-- ============================================================
-- 10. Seed Data — App Settings
-- ============================================================

INSERT INTO app_settings (key, value, description) VALUES
    ('account_name_acbs',          'ACBS',          'Display name for ACBS account'),
    ('account_name_innovision',    'Innovision',    'Display name for Innovision account'),
    ('account_name_infrastructure','Infrastructure','Display name for Infrastructure/Staff account'),
    ('acbs_corpus_amount',         '0',             'Total corpus amount for ACBS bank account'),
    ('acbs_corpus_bank_name',      '',              'Bank name for ACBS account'),
    ('acbs_corpus_account_number', '',              'Account number for ACBS bank account'),
    ('acbs_corpus_last_updated',   '',              'Last update timestamp for ACBS corpus')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Done
-- ============================================================
