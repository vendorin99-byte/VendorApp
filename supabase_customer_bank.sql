-- Rekening bank customer untuk pencairan affiliate
-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS customer_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bank_code VARCHAR(20) NOT NULL,
  account_number VARCHAR(30) NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Migration selesai: customer_bank_accounts' AS status;
