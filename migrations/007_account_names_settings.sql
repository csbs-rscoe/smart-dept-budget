-- Migration to add settings table for configurable account names
-- Run this in Neon console

CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default account names
INSERT INTO app_settings (key, value, description) VALUES
    ('account_name_acbs', 'ACBS', 'Display name for ACBS account'),
    ('account_name_innovision', 'Innovision', 'Display name for Innovision account'),
    ('account_name_infrastructure', 'Infrastructure', 'Display name for Infrastructure/Staff account')
ON CONFLICT (key) DO NOTHING;

-- Verify
SELECT * FROM app_settings;
