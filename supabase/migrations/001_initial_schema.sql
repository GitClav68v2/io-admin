-- ============================================================
-- Integration One Admin Portal — Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Clients ──────────────────────────────────────────────────
create table clients (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz default now(),
  name          text not null,
  company       text,
  email         text,
  phone         text,
  billing_address text,
  billing_city  text,
  billing_state text default 'CA',
  billing_zip   text,
  site_address  text,
  site_city     text,
  site_state    text default 'CA',
  site_zip      text,
  notes         text
);

-- ── Catalog Items (equipment library) ────────────────────────
create table catalog_items (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz default now(),
  category      text not null,  -- 'camera', 'network', 'hardware', 'labor', 'other'
  name          text not null,
  description   text,
  sku           text,
  unit_price    numeric(10,2) not null default 0,
  unit_label    text default 'ea',  -- 'ea', 'hr', 'lot', 'ft'
  taxable       boolean default true,
  active        boolean default true
);

-- ── Proposals ────────────────────────────────────────────────
create table proposals (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  proposal_number text not null unique,  -- IO-2026-0001
  client_id     uuid references clients(id) on delete set null,
  status        text not null default 'draft',  -- draft, sent, accepted, declined, expired
  title         text not null,
  scope_notes   text,
  assumptions   text,
  exclusions    text,
  project_name  text,
  site_address  text,
  site_city     text,
  site_state    text,
  site_zip      text,
  -- billing snapshot (copied from client at time of proposal)
  bill_to_name  text,
  bill_to_company text,
  bill_to_email text,
  bill_to_phone text,
  bill_to_address text,
  bill_to_city  text,
  bill_to_state text,
  bill_to_zip   text,
  -- financials (auto-calculated)
  subtotal_equipment numeric(10,2) default 0,
  subtotal_labor     numeric(10,2) default 0,
  tax_rate           numeric(5,4) default 0.1025,
  tax_amount         numeric(10,2) default 0,
  grand_total        numeric(10,2) default 0,
  -- recurring
  monthly_recurring  numeric(10,2) default 0,
  monthly_notes      text,
  -- payment terms
  deposit_pct        numeric(5,2) default 50,
  progress_pct       numeric(5,2) default 25,
  final_pct          numeric(5,2) default 25,
  -- meta
  valid_days         int default 30,
  expires_at         timestamptz,
  sent_at            timestamptz,
  accepted_at        timestamptz,
  rep_name           text,
  notes              text,
  version            int default 1
);

-- ── Proposal Line Items ───────────────────────────────────────
create table proposal_line_items (
  id            uuid primary key default uuid_generate_v4(),
  proposal_id   uuid not null references proposals(id) on delete cascade,
  catalog_item_id uuid references catalog_items(id) on delete set null,
  section       text not null default 'other',  -- 'cameras', 'network', 'hardware', 'labor', 'other'
  sort_order    int default 0,
  name          text not null,
  description   text,
  sku           text,
  qty           numeric(10,2) default 1,
  unit_label    text default 'ea',
  unit_price    numeric(10,2) not null default 0,
  total         numeric(10,2) generated always as (qty * unit_price) stored,
  taxable       boolean default true,
  is_recurring  boolean default false,
  recurring_label text
);

-- ── Invoices ──────────────────────────────────────────────────
create table invoices (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  invoice_number text not null unique,  -- IO-INV-2026-0001
  proposal_id   uuid references proposals(id) on delete set null,
  client_id     uuid references clients(id) on delete set null,
  status        text not null default 'unpaid',  -- unpaid, partial, paid, void
  title         text not null,
  -- billing snapshot
  bill_to_name  text,
  bill_to_company text,
  bill_to_email text,
  bill_to_phone text,
  bill_to_address text,
  bill_to_city  text,
  bill_to_state text,
  bill_to_zip   text,
  -- financials
  subtotal      numeric(10,2) default 0,
  tax_rate      numeric(5,4) default 0.1025,
  tax_amount    numeric(10,2) default 0,
  grand_total   numeric(10,2) default 0,
  amount_paid   numeric(10,2) default 0,
  balance_due   numeric(10,2) generated always as (grand_total - amount_paid) stored,
  -- dates
  issue_date    date default current_date,
  due_date      date,
  paid_at       timestamptz,
  sent_at       timestamptz,
  -- meta
  notes         text,
  rep_name      text
);

-- ── Invoice Line Items ────────────────────────────────────────
create table invoice_line_items (
  id            uuid primary key default uuid_generate_v4(),
  invoice_id    uuid not null references invoices(id) on delete cascade,
  section       text not null default 'other',
  sort_order    int default 0,
  name          text not null,
  description   text,
  qty           numeric(10,2) default 1,
  unit_label    text default 'ea',
  unit_price    numeric(10,2) not null default 0,
  total         numeric(10,2) generated always as (qty * unit_price) stored,
  taxable       boolean default true
);

-- ── Proposal number sequence ──────────────────────────────────
create sequence proposal_seq start 1;
create sequence invoice_seq start 1;

create or replace function next_proposal_number()
returns text language plpgsql as $$
declare
  yr text := to_char(now(), 'YYYY');
  n  int  := nextval('proposal_seq');
begin
  return 'IO-' || yr || '-' || lpad(n::text, 4, '0');
end;
$$;

create or replace function next_invoice_number()
returns text language plpgsql as $$
declare
  yr text := to_char(now(), 'YYYY');
  n  int  := nextval('invoice_seq');
begin
  return 'IO-INV-' || yr || '-' || lpad(n::text, 4, '0');
end;
$$;

-- Auto-set proposal number on insert
create or replace function set_proposal_number()
returns trigger language plpgsql as $$
begin
  if new.proposal_number is null or new.proposal_number = '' then
    new.proposal_number := next_proposal_number();
  end if;
  new.updated_at := now();
  new.expires_at := now() + (new.valid_days || ' days')::interval;
  return new;
end;
$$;

create trigger trg_proposal_number
  before insert or update on proposals
  for each row execute function set_proposal_number();

-- Auto-set invoice number on insert
create or replace function set_invoice_number()
returns trigger language plpgsql as $$
begin
  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := next_invoice_number();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_invoice_number
  before insert or update on invoices
  for each row execute function set_invoice_number();

-- ── Seed catalog items ────────────────────────────────────────
insert into catalog_items (category, name, description, sku, unit_price, unit_label, taxable) values
-- Cameras
('camera', 'Hikvision DS-2CD2143G2-I 4MP AcuSense Dome', 'Indoor/outdoor, IR 40m, H.265+, PoE, 2.8mm lens', 'DS-2CD2143G2-I', 189.00, 'ea', true),
('camera', 'Hikvision DS-2CD2T47G2-L 4MP ColorVu Turret', 'Full-color night vision, built-in siren, PoE', 'DS-2CD2T47G2-L', 249.00, 'ea', true),
('camera', 'Hikvision DS-2CD2347G2-LU 4MP ColorVu Dome', 'Outdoor dome, color 24/7, microphone', 'DS-2CD2347G2-LU', 219.00, 'ea', true),
('camera', 'Hikvision DS-2CD2T86G2-ISU 8MP AcuSense Bullet', '4K bullet, IR 60m, 2.8mm lens, PoE', 'DS-2CD2T86G2-ISU', 329.00, 'ea', true),
('camera', 'Deep Sentinel Smart Hub DS-HUB-200', 'Connects cameras to 24/7 live guard monitoring network', 'DS-HUB-200', 299.00, 'ea', true),
-- Network & Storage
('network', 'Hikvision DS-7608NXI-I2/S 8-Ch AcuSense NVR', '8-channel, H.265+, 4K output, 80Mbps', 'DS-7608NXI-I2', 389.00, 'ea', true),
('network', 'Hikvision DS-7616NXI-I2/S 16-Ch AcuSense NVR', '16-channel, H.265+, 4K output', 'DS-7616NXI-I2', 589.00, 'ea', true),
('network', 'Seagate SkyHawk 4TB Surveillance HDD', 'AI-optimized, ~60 days retention at standard bitrate', 'ST4000VX016', 89.00, 'ea', true),
('network', 'Seagate SkyHawk 8TB Surveillance HDD', 'AI-optimized, ~120 days retention', 'ST8000VX010', 149.00, 'ea', true),
('network', 'TP-Link TL-SG1008P 8-Port Gigabit PoE Switch', '64W PoE budget, powers up to 8 cameras', 'TL-SG1008P', 79.00, 'ea', true),
('network', 'TP-Link TL-SG1016P 16-Port Gigabit PoE Switch', '150W PoE budget', 'TL-SG1016P', 149.00, 'ea', true),
-- Hardware
('hardware', 'Surface mount junction boxes & camera brackets', 'Stainless hardware, weatherproof', null, 145.00, 'lot', true),
('hardware', 'Cat6 plenum cable 500ft + RJ45 keystones', 'Rated for in-wall/ceiling runs', null, 210.00, 'lot', true),
('hardware', 'EMT conduit, fittings, and straps', 'Interior exposed runs per local code', null, 185.00, 'lot', true),
('hardware', 'Miscellaneous install hardware allowance', 'Anchors, cable ties, labels, connectors', null, 95.00, 'lot', true),
-- Labor
('labor', 'Site Survey & System Design', 'Camera placement, cable path, NVR location, network design', null, 95.00, 'hr', false),
('labor', 'Cable Pulling & Termination', 'Licensed low-voltage installer', null, 85.00, 'hr', false),
('labor', 'Camera Mounting & NVR Install', 'Physical mounting, rack install, PoE switch config', null, 85.00, 'hr', false),
('labor', 'System Programming & NVR Setup', 'Motion zones, recording schedules, remote access', null, 95.00, 'hr', false),
('labor', 'Deep Sentinel Activation', 'Hub registration, camera pairing, live guard activation', null, 95.00, 'hr', false),
('labor', 'Client Walkthrough & Training', 'Remote access setup, NVR app + DS app training', null, 95.00, 'hr', false),
('labor', 'Project Management (Integration One)', 'Coordination, scheduling, subcontractor oversight', null, 95.00, 'hr', false),
('labor', 'After-Hours / Emergency Labor', 'Outside normal business hours', null, 145.00, 'hr', false);

-- ── RLS (all tables admin-only via service role) ──────────────
alter table clients          enable row level security;
alter table catalog_items    enable row level security;
alter table proposals        enable row level security;
alter table proposal_line_items enable row level security;
alter table invoices         enable row level security;
alter table invoice_line_items  enable row level security;

-- Authenticated users (team) can do everything
create policy "team_all" on clients           for all to authenticated using (true) with check (true);
create policy "team_all" on catalog_items     for all to authenticated using (true) with check (true);
create policy "team_all" on proposals         for all to authenticated using (true) with check (true);
create policy "team_all" on proposal_line_items for all to authenticated using (true) with check (true);
create policy "team_all" on invoices          for all to authenticated using (true) with check (true);
create policy "team_all" on invoice_line_items  for all to authenticated using (true) with check (true);
