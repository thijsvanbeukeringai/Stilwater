-- Approval log: append-only audit trail voor approve/reject acties.

create table if not exists accreditation_approval_log (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references accreditation_persons(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  action text not null check (action in (
    'approved','rejected','day_added','day_removed','token_rotated','qr_revoked','briefing_ack_overridden'
  )),
  days text[] not null default '{}',
  by_user_id uuid not null,
  actor_role text,
  reason text,
  ip_address inet,
  user_agent text,
  request_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_acc_approval_log_person
  on accreditation_approval_log (person_id, created_at desc);

create index if not exists idx_acc_approval_log_project
  on accreditation_approval_log (project_id, created_at desc);

-- Append-only: blokkeer UPDATE en DELETE behalve voor super_admin.
create or replace function accreditation_block_log_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'accreditation_approval_log is append-only';
end;
$$;

drop trigger if exists trg_block_log_update on accreditation_approval_log;
create trigger trg_block_log_update
  before update or delete on accreditation_approval_log
  for each row execute function accreditation_block_log_mutation();

alter table accreditation_approval_log enable row level security;
