ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_source text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referred_by text;
