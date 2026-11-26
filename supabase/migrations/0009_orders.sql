-- Bizloom Phase 2: orders & sales.
-- Order creation is the one place in the app that must be transactional
-- (stock must move exactly once per item, or not at all) so it goes through
-- a single RPC rather than several separate client-side inserts.

create type order_status as enum (
  'draft', 'pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded'
);
create type order_payment_status as enum ('unpaid', 'partial', 'paid', 'refunded');

create table orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid references customers (id) on delete set null,
  order_number text not null,
  status order_status not null default 'pending',
  payment_status order_payment_status not null default 'unpaid',
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, order_number)
);

create index orders_business_id_idx on orders (business_id);
create index orders_customer_id_idx on orders (customer_id);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on order_items (order_id);

-- ---------------------------------------------------------------------------
-- RPC: atomically create an order — validates stock, decrements it, logs a
-- stock_movements row per item, computes totals, generates the order number.
-- p_items shape: [{ "product_id": "...", "quantity": 2 }, ...]
-- ---------------------------------------------------------------------------
create function create_order(
  p_business_id uuid,
  p_items jsonb,
  p_customer_id uuid default null,
  p_discount numeric default 0,
  p_tax numeric default 0,
  p_notes text default null
)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders;
  v_item jsonb;
  v_product products;
  v_quantity integer;
  v_subtotal numeric := 0;
  v_line_total numeric;
  v_next_seq int;
  v_order_number text;
begin
  if not is_business_manager_or_above(p_business_id) then
    raise exception 'not authorized';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'an order needs at least one item';
  end if;

  select count(*) + 1 into v_next_seq from orders where business_id = p_business_id;
  v_order_number := 'ORD-' || lpad(v_next_seq::text, 5, '0');

  insert into orders (business_id, customer_id, order_number, discount, tax, notes)
  values (p_business_id, p_customer_id, v_order_number, p_discount, p_tax, p_notes)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from products
    where id = (v_item ->> 'product_id')::uuid
      and business_id = p_business_id
      and archived_at is null
    for update;

    if v_product.id is null then
      raise exception 'product % not found', v_item ->> 'product_id';
    end if;

    v_quantity := (v_item ->> 'quantity')::int;
    if v_quantity <= 0 then
      raise exception 'quantity must be positive';
    end if;
    if v_product.stock_quantity < v_quantity then
      raise exception 'not enough stock for %: have %, need %',
        v_product.name, v_product.stock_quantity, v_quantity;
    end if;

    v_line_total := v_product.selling_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    values (v_order.id, v_product.id, v_product.name, v_product.selling_price, v_quantity, v_line_total);

    update products set stock_quantity = stock_quantity - v_quantity where id = v_product.id;

    insert into stock_movements (business_id, product_id, quantity_delta, reason, created_by)
    values (p_business_id, v_product.id, -v_quantity, 'Order ' || v_order_number, auth.uid());
  end loop;

  update orders
  set subtotal = v_subtotal,
      total = v_subtotal - p_discount + p_tax
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

grant execute on function create_order to authenticated;

alter table orders enable row level security;
alter table order_items enable row level security;

create policy orders_select on orders
  for select
  using (is_business_member(business_id));

create policy orders_update on orders
  for update
  using (is_business_manager_or_above(business_id))
  with check (is_business_manager_or_above(business_id));

create policy order_items_select on order_items
  for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and is_business_member(orders.business_id)
    )
  );
