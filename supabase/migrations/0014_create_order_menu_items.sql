-- Extend create_order() to accept menu-item-based line items (no stock
-- tracking, no stock_movements row) alongside the existing product-based
-- ones, plus order_type/table_id. Each item in p_items has either a
-- "product_id" or a "menu_item_id" key, never both.

create or replace function create_order(
  p_business_id uuid,
  p_items jsonb,
  p_customer_id uuid default null,
  p_discount numeric default 0,
  p_tax numeric default 0,
  p_notes text default null,
  p_order_type text default 'retail',
  p_table_id uuid default null
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
  v_menu_item menu_items;
  v_quantity integer;
  v_subtotal numeric := 0;
  v_line_total numeric;
  v_next_seq int;
  v_order_number text;
  v_new_stock integer;
begin
  if not is_business_manager_or_above(p_business_id) then
    raise exception 'not authorized';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'an order needs at least one item';
  end if;

  select count(*) + 1 into v_next_seq from orders where business_id = p_business_id;
  v_order_number := 'ORD-' || lpad(v_next_seq::text, 5, '0');

  insert into orders (business_id, customer_id, order_number, discount, tax, notes, order_type, table_id)
  values (p_business_id, p_customer_id, v_order_number, p_discount, p_tax, p_notes, p_order_type, p_table_id)
  returning * into v_order;

  if p_table_id is not null then
    update restaurant_tables set status = 'occupied' where id = p_table_id and business_id = p_business_id;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::int;
    if v_quantity <= 0 then
      raise exception 'quantity must be positive';
    end if;

    if v_item ? 'menu_item_id' then
      select * into v_menu_item
      from menu_items
      where id = (v_item ->> 'menu_item_id')::uuid
        and business_id = p_business_id
        and archived_at is null
      for update;

      if v_menu_item.id is null then
        raise exception 'menu item % not found', v_item ->> 'menu_item_id';
      end if;

      v_line_total := v_menu_item.price * v_quantity;
      v_subtotal := v_subtotal + v_line_total;

      insert into order_items (order_id, menu_item_id, product_name, unit_price, quantity, line_total)
      values (v_order.id, v_menu_item.id, v_menu_item.name, v_menu_item.price, v_quantity, v_line_total);
    else
      select * into v_product
      from products
      where id = (v_item ->> 'product_id')::uuid
        and business_id = p_business_id
        and archived_at is null
      for update;

      if v_product.id is null then
        raise exception 'product % not found', v_item ->> 'product_id';
      end if;
      if v_product.stock_quantity < v_quantity then
        raise exception 'not enough stock for %: have %, need %',
          v_product.name, v_product.stock_quantity, v_quantity;
      end if;

      v_line_total := v_product.selling_price * v_quantity;
      v_subtotal := v_subtotal + v_line_total;

      insert into order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
      values (v_order.id, v_product.id, v_product.name, v_product.selling_price, v_quantity, v_line_total);

      v_new_stock := v_product.stock_quantity - v_quantity;
      update products set stock_quantity = v_new_stock where id = v_product.id;

      insert into stock_movements (business_id, product_id, quantity_delta, reason, created_by)
      values (p_business_id, v_product.id, -v_quantity, 'Order ' || v_order_number, auth.uid());

      if v_new_stock <= v_product.reorder_level then
        insert into notifications (business_id, type, title, body, link)
        values (
          p_business_id,
          'low_stock',
          'Low stock: ' || v_product.name,
          v_new_stock || ' ' || v_product.unit || ' left (reorder level ' || v_product.reorder_level || ')',
          '/app/products'
        );
      end if;
    end if;
  end loop;

  update orders
  set subtotal = v_subtotal,
      total = v_subtotal - p_discount + p_tax
  where id = v_order.id
  returning * into v_order;

  insert into notifications (business_id, type, title, body, link)
  values (
    p_business_id,
    'order_created',
    'New order ' || v_order_number,
    'Total ' || v_order.total,
    '/app/sales/' || v_order.id
  );

  return v_order;
end;
$$;
