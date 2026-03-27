ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS corporate_address text,
  ADD COLUMN IF NOT EXISTS corporate_city    text,
  ADD COLUMN IF NOT EXISTS corporate_state   text,
  ADD COLUMN IF NOT EXISTS corporate_zip     text;
