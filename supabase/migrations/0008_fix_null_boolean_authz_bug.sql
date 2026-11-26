-- SECURITY FIX: is_business_admin() / is_business_manager_or_above() returned
-- SQL NULL (not false) for a non-member, because `x IN (...)` is NULL when x
-- is NULL. RLS policies were unaffected (Postgres treats a NULL USING/CHECK
-- result as deny), but any SECURITY DEFINER function using these in a
-- plpgsql `IF NOT ... THEN raise exception` guard was NOT — `IF NULL THEN`
-- is treated as false and skips the raise, silently granting access.
-- Found via a live cross-tenant test against adjust_product_stock(), where
-- an unrelated user was able to modify another business's product stock.
--
-- Fix: make every one of these helpers return a definite boolean, never NULL.

create or replace function is_business_admin(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(get_business_role(target_business_id) in ('owner', 'admin'), false);
$$;

create or replace function is_business_manager_or_above(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(get_business_role(target_business_id) in ('owner', 'admin', 'manager'), false);
$$;
