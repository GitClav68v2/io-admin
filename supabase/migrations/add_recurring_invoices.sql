-- Recurring invoice schedules
create table if not exists recurring_invoices (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  template_invoice_id uuid not null references invoices(id) on delete cascade,
  client_id           uuid references clients(id) on delete set null,
  frequency           text not null default 'monthly'
    check (frequency in ('monthly','quarterly','annual')),
  next_due_date       date not null,
  end_date            date,
  active              boolean not null default true,
  last_generated_at   timestamptz,
  notes               text
);

-- Track which invoices were generated from a recurring schedule
alter table invoices add column if not exists
  recurring_invoice_id uuid references recurring_invoices(id) on delete set null;

alter table recurring_invoices enable row level security;

create policy "team_all" on recurring_invoices
  for all to authenticated using (true) with check (true);
