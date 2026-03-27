ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS billing_city    text,
  ADD COLUMN IF NOT EXISTS billing_state   text,
  ADD COLUMN IF NOT EXISTS billing_zip     text;
