-- Bizloom Phase 5: Restaurant vertical.
--
-- Architectural choice: rather than a parallel order pipeline per industry
-- (as a literal reading of the spec's "kitchen_orders"/"kitchen_order_items"
-- tables would suggest), restaurant orders flow through the SAME orders/
-- order_items tables every other business type uses. That means Finance,
-- Reports and the Dashboard's revenue aggregates keep working for a
-- restaurant with zero extra wiring — order_items just gains a menu_item_id
-- alongside the existing product_id, and orders gains order_type + table_id.
-- This pattern (one unified revenue ledger, per-industry catalog tables)
-- is the template for gym/salon/coaching/wholesale/service too.

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  category text,
  description text,
  price numeric(12, 2) not null default 0 check (price >= 0),
  is_available boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_business_id_idx on menu_items (business_id);
create index menu_items_business_id_active_idx on menu_items (business_id) where archived_at is null;

create trigger menu_items_set_updated_at
  before update on menu_items
  for each row execute function set_updated_at();

create table restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  table_number text not null,
  capacity integer not null default 2 check (capacity > 0),
  status text not null default 'available' check (status in ('available', 'occupied', 'reserved', 'cleaning')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, table_number)
);

create index restaurant_tables_business_id_idx on restaurant_tables (business_id);

create trigger restaurant_tables_set_updated_at
  before update on restaurant_tables
  for each row execute function set_updated_at();

alter table menu_items enable row level security;
alter table restaurant_tables enable row level security;

create policy menu_items_select on menu_items
  for select using (is_business_member(business_id));
create policy menu_items_insert on menu_items
  for insert with check (is_business_manager_or_above(business_id));
create policy menu_items_update on menu_items
  for update using (is_business_manager_or_above(business_id)) with check (is_business_manager_or_above(business_id));

create policy restaurant_tables_select on restaurant_tables
  for select using (is_business_member(business_id));
create policy restaurant_tables_insert on restaurant_tables
  for insert with check (is_business_manager_or_above(business_id));
create policy restaurant_tables_update on restaurant_tables
  for update using (is_business_manager_or_above(business_id)) with check (is_business_manager_or_above(business_id));

-- ---------------------------------------------------------------------------
-- Extend orders / order_items for dine-in/takeaway/delivery
-- ---------------------------------------------------------------------------
alter table orders add column order_type text not null default 'retail'
  check (order_type in ('retail', 'dine_in', 'takeaway', 'delivery'));
alter table orders add column table_id uuid references restaurant_tables (id) on delete set null;

alter table order_items add column menu_item_id uuid references menu_items (id) on delete set null;
alter table order_items alter column product_id drop not null;
alter table order_items add constraint order_items_one_catalog_source check (
  (product_id is not null) <> (menu_item_id is not null)
);
