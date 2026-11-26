-- Bizloom Phase 2: customer management (CRM core)

create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  phone text,
  email text,
  customer_type text,
  address text,
  notes text,
  tags text[] not null default '{}'::text[],
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_business_id_idx on customers (business_id);
create index customers_business_id_active_idx on customers (business_id) where archived_at is null;

create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

create function is_business_manager_or_above(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select get_business_role(target_business_id) in ('owner', 'admin', 'manager');
$$;

alter table customers enable row level security;

create policy customers_select on customers
  for select
  using (is_business_member(business_id));

create policy customers_insert on customers
  for insert
  with check (is_business_manager_or_above(business_id));

create policy customers_update on customers
  for update
  using (is_business_manager_or_above(business_id))
  with check (is_business_manager_or_above(business_id));
