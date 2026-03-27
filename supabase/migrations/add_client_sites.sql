CREATE TABLE IF NOT EXISTS client_sites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label      text,
  address    text NOT NULL,
  city       text,
  state      text DEFAULT 'CA',
  zip        text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_all" ON client_sites FOR ALL TO authenticated USING (true) WITH CHECK (true);
