-- Bizloom Phase 4: real notifications — a feed of actual business events,
-- not a static "you're all caught up" placeholder. user_id null means
-- visible to every member of the business; set means a personal notice.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  created_at timestamptz not null default now()
);

create index notifications_business_id_idx on notifications (business_id, created_at desc);

alter table notifications enable row level security;

create policy notifications_select on notifications
  for select
  using (
    is_business_member(business_id)
    and (user_id is null or user_id = auth.uid())
  );

-- Low-stock + order-created notifications are inserted from inside
-- create_order() (security definer, already in that transaction).
-- Employee-invite notifications are inserted here via a trigger, since
-- invites happen via a plain client-side insert, not an RPC.
create function notify_employee_invited()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'invited' and new.invited_email is not null then
    insert into notifications (business_id, type, title, body, link)
    values (
      new.business_id,
      'employee_invited',
      'Invite sent to ' || new.invited_email,
      'Role: ' || new.role,
      '/app/employees'
    );
  end if;
  return new;
end;
$$;

create trigger business_memberships_notify_invited
  after insert on business_memberships
  for each row execute function notify_employee_invited();
