-- Bizloom Phase 1: core multi-tenant schema (profiles, businesses, memberships, settings, module catalog)

create extension if not exists pgcrypto;

create type business_type as enum (
  'retail',
  'gym',
  'restaurant',
  'salon',
  'coaching',
  'wholesale',
  'service',
  'other'
);

create type membership_role as enum ('owner', 'admin', 'manager', 'staff');
create type membership_status as enum ('active', 'invited', 'suspended');

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete restrict,
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  business_type business_type not null,
  logo_url text,
  contact_email text,
  contact_phone text,
  address text,
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  operating_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_id_idx on businesses (owner_id);

-- ---------------------------------------------------------------------------
-- business_memberships: who can access which business, with what role
-- ---------------------------------------------------------------------------
create table business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  invited_email text,
  role membership_role not null default 'staff',
  permissions jsonb not null default '{}'::jsonb,
  status membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_memberships_user_or_invite check (
    user_id is not null or invited_email is not null
  ),
  constraint business_memberships_unique_user unique (business_id, user_id)
);

create index business_memberships_business_id_idx on business_memberships (business_id);
create index business_memberships_user_id_idx on business_memberships (user_id);

-- ---------------------------------------------------------------------------
-- business_settings: enabled modules + free-form settings per business
-- ---------------------------------------------------------------------------
create table business_settings (
  business_id uuid primary key references businesses (id) on delete cascade,
  enabled_modules text[] not null default '{}'::text[],
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- industry_modules: static catalog of modules available per business type
-- ---------------------------------------------------------------------------
create table industry_modules (
  key text primary key,
  business_type business_type not null,
  label text not null,
  description text,
  is_core boolean not null default false,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_set_updated_at
  before update on businesses
  for each row execute function set_updated_at();

create trigger business_memberships_set_updated_at
  before update on business_memberships
  for each row execute function set_updated_at();

create trigger business_settings_set_updated_at
  before update on business_settings
  for each row execute function set_updated_at();

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- security-definer helpers used by RLS policies (avoid recursive RLS)
-- ---------------------------------------------------------------------------
create function is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from business_memberships
    where business_id = target_business_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create function get_business_role(target_business_id uuid)
returns membership_role
language sql
security definer
set search_path = public
stable
as $$
  select role from business_memberships
  where business_id = target_business_id
    and user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

create function is_business_admin(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select get_business_role(target_business_id) in ('owner', 'admin');
$$;

-- ---------------------------------------------------------------------------
-- RPC: atomically create a business and its owner membership + settings
-- ---------------------------------------------------------------------------
create function create_business(
  p_name text,
  p_slug text,
  p_business_type business_type,
  p_currency text default 'INR',
  p_timezone text default 'Asia/Kolkata',
  p_contact_email text default null,
  p_contact_phone text default null,
  p_address text default null,
  p_operating_hours jsonb default '{}'::jsonb,
  p_enabled_modules text[] default '{}'::text[],
  p_logo_url text default null
)
returns businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business businesses;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into businesses (
    owner_id, name, slug, business_type, currency, timezone,
    contact_email, contact_phone, address, operating_hours, logo_url
  ) values (
    auth.uid(), p_name, p_slug, p_business_type, p_currency, p_timezone,
    p_contact_email, p_contact_phone, p_address, p_operating_hours, p_logo_url
  )
  returning * into v_business;

  insert into business_memberships (business_id, user_id, role, status)
  values (v_business.id, auth.uid(), 'owner', 'active');

  insert into business_settings (business_id, enabled_modules)
  values (v_business.id, p_enabled_modules);

  return v_business;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table businesses enable row level security;
alter table business_memberships enable row level security;
alter table business_settings enable row level security;
alter table industry_modules enable row level security;

-- profiles: see your own profile, or profiles of people you share a business with
create policy profiles_select on profiles
  for select
  using (
    id = auth.uid()
    or exists (
      select 1 from business_memberships bm1
      join business_memberships bm2 on bm1.business_id = bm2.business_id
      where bm1.user_id = auth.uid()
        and bm1.status = 'active'
        and bm2.user_id = profiles.id
        and bm2.status = 'active'
    )
  );

create policy profiles_update_self on profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- businesses: members can see; owner/admin can update; nobody inserts directly
-- (creation goes through the create_business() RPC) or deletes from the client
create policy businesses_select on businesses
  for select
  using (is_business_member(id));

create policy businesses_update on businesses
  for update
  using (is_business_admin(id))
  with check (is_business_admin(id));

-- business_memberships: see your own row, or co-members of a business you belong to
create policy business_memberships_select on business_memberships
  for select
  using (
    user_id = auth.uid()
    or is_business_member(business_id)
  );

create policy business_memberships_insert on business_memberships
  for insert
  with check (is_business_admin(business_id));

create policy business_memberships_update on business_memberships
  for update
  using (is_business_admin(business_id))
  with check (is_business_admin(business_id));

create policy business_memberships_delete on business_memberships
  for delete
  using (is_business_admin(business_id));

-- business_settings: members can read; owner/admin can change
create policy business_settings_select on business_settings
  for select
  using (is_business_member(business_id));

create policy business_settings_update on business_settings
  for update
  using (is_business_admin(business_id))
  with check (is_business_admin(business_id));

-- industry_modules: public reference catalog, readable by any authenticated user
create policy industry_modules_select on industry_modules
  for select
  to authenticated
  using (true);

grant execute on function create_business to authenticated;
