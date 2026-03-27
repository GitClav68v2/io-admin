ALTER TABLE proposals ADD COLUMN IF NOT EXISTS conditional_inspection boolean NOT NULL DEFAULT false;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS inspection_clause text;
