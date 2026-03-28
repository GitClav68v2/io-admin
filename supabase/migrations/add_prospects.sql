-- Prospects table — mirrors the quote request form on integrationone.net
create table if not exists prospects (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  company     text,
  email       text,
  phone       text,
  zip         text,
  city        text,
  state       text default 'CA',
  business_type text,
  areas       text[] default '{}',
  lead_source text,
  notes       text,
  status      text not null default 'new'
    check (status in ('new','contacted','qualified','converted','lost'))
);

alter table prospects enable row level security;

create policy "Authenticated users can do everything with prospects"
  on prospects for all
  to authenticated
  using (true)
  with check (true);
