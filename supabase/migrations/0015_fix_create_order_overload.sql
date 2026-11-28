-- Bug found via live testing: CREATE OR REPLACE FUNCTION does not replace an
-- existing function when the parameter list changes shape — Postgres treats
-- a different argument list as a distinct overload. Adding p_order_type/
-- p_table_id in 0014 therefore left the OLD 6-parameter create_order()
-- alongside the new 8-parameter one, and PostgREST can't disambiguate a call
-- that only supplies the parameters both signatures share (PGRST203).
-- Drop the stale overload explicitly; the 8-parameter version is canonical.

drop function if exists create_order(uuid, jsonb, uuid, numeric, numeric, text);
