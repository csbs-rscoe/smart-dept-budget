-- Migration to add ACBS corpus settings
-- Run this in Neon console

-- Insert ACBS corpus settings into app_settings
INSERT INTO app_settings (key, value, description) VALUES
    ('acbs_corpus_amount', '0', 'Total corpus amount for ACBS bank account'),
    ('acbs_corpus_bank_name', '', 'Bank name for ACBS account'),
    ('acbs_corpus_account_number', '', 'Account number for ACBS bank account'),
    ('acbs_corpus_last_updated', '', 'Last update timestamp for ACBS corpus')
ON CONFLICT (key) DO NOTHING;

-- Verify
SELECT * FROM app_settings WHERE key LIKE 'acbs_corpus%';
