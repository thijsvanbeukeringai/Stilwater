-- Accreditatie v2 — core schema
-- Hergebruikt v1 structuur met expliciet `scope`, `color`, `category` op item types
-- en `default_meal_config` / `default_zone_setup` op projects.

set check_function_bodies = off;

create extension if not exists "pgcrypto";

-- Projects: aangenomen dat deze in een gedeelde IMS-tabel leven.
-- Voor accreditatie v2 voegen we een paar kolommen toe.
do $$
begin
  if not exists (select 1 from pg_tables where tablename = 'projects') then
    create table projects (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      client text,
      show_days text[] not null default '{}',
      build_days text[] not null default '{}',
      day_meals jsonb not null default '{}'::jsonb,
      day_items jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
  end if;
end $$;

alter table projects
  add column if not exists default_meal_config jsonb,
  add column if not exists default_zone_setup jsonb,
  add column if not exists v2_enabled boolean not null default false;

-- Groups
create table if not exists accreditation_groups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  contact_name text,
  contact_email text,
  type text not null check (type in ('crew','artist','supplier','press','vip','other')),
  invite_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  invite_expires_at timestamptz,
  item_limits jsonb not null default '{}'::jsonb,
  max_persons int,
  meal_config jsonb,
  created_at timestamptz not null default now()
);

-- Zones
create table if not exists accreditation_zones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  color text not null default '#3b82f6',
  capacity int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Item types (incl. wristbands na merge)
create table if not exists accreditation_item_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  total_available int,
  variants text[] not null default '{}',
  sort_order int not null default 0,
  color text,
  category text not null default 'other'
    check (category in ('wristband','equipment','parking','other')),
  scope text not null default 'per_person'
    check (scope in ('per_person','per_day')),
  created_at timestamptz not null default now(),
  constraint wristband_requires_color
    check (category <> 'wristband' or color is not null)
);

-- Persons
create table if not exists accreditation_persons (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  group_id uuid not null references accreditation_groups(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  role text,
  status text not null default 'draft'
    check (status in ('draft','approved','rejected','checked_in','checked_out')),
  qr_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  valid_days text[] not null default '{}',
  approved_days text[] not null default '{}',
  meal_selections jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Person zones (M:N)
create table if not exists accreditation_person_zones (
  person_id uuid not null references accreditation_persons(id) on delete cascade,
  zone_id uuid not null references accreditation_zones(id) on delete cascade,
  primary key (person_id, zone_id)
);

-- Person items
create table if not exists accreditation_person_items (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references accreditation_persons(id) on delete cascade,
  item_type_id uuid not null references accreditation_item_types(id) on delete cascade,
  quantity int not null default 1,
  selected_variant text,
  day text,
  issued boolean not null default false,
  issued_at timestamptz,
  created_at timestamptz not null default now()
);

-- Scan log
create table if not exists accreditation_scan_log (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references accreditation_persons(id) on delete set null,
  qr_token text not null,
  success boolean not null,
  action text not null check (action in ('check_in','check_out','lookup')),
  message text,
  scanned_at timestamptz not null default now()
);

-- RLS
alter table accreditation_groups enable row level security;
alter table accreditation_zones enable row level security;
alter table accreditation_item_types enable row level security;
alter table accreditation_persons enable row level security;
alter table accreditation_person_zones enable row level security;
alter table accreditation_person_items enable row level security;
alter table accreditation_scan_log enable row level security;
