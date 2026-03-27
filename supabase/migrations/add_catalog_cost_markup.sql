ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS markup_pct numeric DEFAULT 0;

ALTER TABLE proposal_line_items ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;
