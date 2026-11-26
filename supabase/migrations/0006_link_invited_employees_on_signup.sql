-- Bizloom Phase 2: when someone signs up with an email that was invited to a
-- business (business_memberships.invited_email), link that membership to
-- their new account automatically instead of leaving it stranded forever.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  update business_memberships
  set user_id = new.id,
      status = 'active',
      invited_email = null
  where invited_email = new.email
    and user_id is null;

  return new;
end;
$$;
