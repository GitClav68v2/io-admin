CREATE TABLE IF NOT EXISTS commission_rates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email     text NOT NULL,
  rep_name       text,
  rate_pct       numeric NOT NULL DEFAULT 10,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at     timestamptz DEFAULT now()
);

-- cost_price snapshot on line items (may already exist from catalog migration, use IF NOT EXISTS)
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;
ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;
