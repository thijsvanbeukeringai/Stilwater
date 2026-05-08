-- Briefings: gekoppeld aan project of specifieke groep.

create table if not exists accreditation_briefings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  group_id uuid references accreditation_groups(id) on delete cascade,
  title text not null,
  content text not null default '',
  file_url text,
  mandatory boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_acc_briefings_project
  on accreditation_briefings (project_id);

create index if not exists idx_acc_briefings_group
  on accreditation_briefings (group_id);

alter table accreditation_briefings enable row level security;
