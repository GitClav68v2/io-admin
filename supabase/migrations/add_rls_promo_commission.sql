-- Enable RLS and add team policies for tables missing them

alter table promo_codes         enable row level security;
alter table commission_rates    enable row level security;
alter table company_settings    enable row level security;

create policy "team_all" on promo_codes      for all to authenticated using (true) with check (true);
create policy "team_all" on commission_rates for all to authenticated using (true) with check (true);
create policy "team_all" on company_settings for all to authenticated using (true) with check (true);
