-- Bizloom Phase 2: products & inventory.
-- category/supplier are kept as plain text for now rather than normalized
-- tables — fast to ship, easy to migrate to proper tables later once a
-- business actually needs managed category/supplier records.

create table products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  sku text,
  category text,
  supplier text,
  description text,
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  selling_price numeric(12, 2) not null default 0 check (selling_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  reorder_level integer not null default 0 check (reorder_level >= 0),
  unit text not null default 'pcs',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_business_id_idx on products (business_id);
create index products_business_id_active_idx on products (business_id) where archived_at is null;
create unique index products_business_id_sku_idx on products (business_id, sku) where sku is not null and sku <> '';

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  quantity_delta integer not null check (quantity_delta <> 0),
  reason text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index stock_movements_product_id_idx on stock_movements (product_id);
create index stock_movements_business_id_idx on stock_movements (business_id);

-- ---------------------------------------------------------------------------
-- RPC: atomically adjust stock + log the movement (never update stock_quantity
-- directly from the client — always go through this)
-- ---------------------------------------------------------------------------
create function adjust_product_stock(
  p_product_id uuid,
  p_delta integer,
  p_reason text default null
)
returns products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_product products;
begin
  select business_id into v_business_id from products where id = p_product_id;
  if v_business_id is null then
    raise exception 'product not found';
  end if;
  if not is_business_manager_or_above(v_business_id) then
    raise exception 'not authorized';
  end if;

  update products
  set stock_quantity = stock_quantity + p_delta
  where id = p_product_id
  returning * into v_product;

  insert into stock_movements (business_id, product_id, quantity_delta, reason, created_by)
  values (v_business_id, p_product_id, p_delta, p_reason, auth.uid());

  return v_product;
end;
$$;

grant execute on function adjust_product_stock to authenticated;

alter table products enable row level security;
alter table stock_movements enable row level security;

create policy products_select on products
  for select
  using (is_business_member(business_id));

create policy products_insert on products
  for insert
  with check (is_business_manager_or_above(business_id));

create policy products_update on products
  for update
  using (is_business_manager_or_above(business_id))
  with check (is_business_manager_or_above(business_id));

create policy stock_movements_select on stock_movements
  for select
  using (is_business_member(business_id));
