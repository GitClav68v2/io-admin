CREATE TABLE IF NOT EXISTS promo_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  type        text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value       numeric NOT NULL,
  expiry_date date,
  max_uses    integer,
  uses_count  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS promo_code text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS promo_discount numeric NOT NULL DEFAULT 0;
