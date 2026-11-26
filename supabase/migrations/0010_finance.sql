-- Bizloom Phase 2: finance — expenses. Income/revenue is derived from
-- orders (no separate "income" table needed: an order already is a revenue
-- event). Payments/receivables/cash-flow tracking is a later phase.

create table expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  expense_date date not null default current_date,
  category text,
  vendor text,
  description text,
  amount numeric(12, 2) not null check (amount >= 0),
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_business_id_idx on expenses (business_id);

create trigger expenses_set_updated_at
  before update on expenses
  for each row execute function set_updated_at();

alter table expenses enable row level security;

create policy expenses_select on expenses
  for select
  using (is_business_member(business_id));

create policy expenses_insert on expenses
  for insert
  with check (is_business_manager_or_above(business_id));

create policy expenses_update on expenses
  for update
  using (is_business_manager_or_above(business_id))
  with check (is_business_manager_or_above(business_id));

create policy expenses_delete on expenses
  for delete
  using (is_business_manager_or_above(business_id));
