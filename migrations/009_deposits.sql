-- Migration to add deposits table for ACBS Bank Account tracking
-- Run this in Neon console

CREATE TABLE IF NOT EXISTS deposits (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for date filtering
CREATE INDEX IF NOT EXISTS idx_deposits_date ON deposits(deposit_date);

-- Verify
SELECT 'deposits table created' as status;
