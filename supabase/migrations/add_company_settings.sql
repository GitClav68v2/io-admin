CREATE TABLE IF NOT EXISTS company_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address         text,
  phone           text,
  license_number  text,
  teams_link      text,
  logo_url        text,
  updated_at      timestamptz DEFAULT now()
);
INSERT INTO company_settings (address, phone, license_number)
VALUES ('', '(949) 233-1833', '')
ON CONFLICT DO NOTHING;
