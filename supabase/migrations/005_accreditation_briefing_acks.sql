-- Briefing acknowledgements per persoon.

create table if not exists accreditation_briefing_acks (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references accreditation_persons(id) on delete cascade,
  briefing_id uuid not null references accreditation_briefings(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  unique (person_id, briefing_id)
);

create index if not exists idx_acc_briefing_acks_briefing
  on accreditation_briefing_acks (briefing_id, person_id);

alter table accreditation_briefing_acks enable row level security;
