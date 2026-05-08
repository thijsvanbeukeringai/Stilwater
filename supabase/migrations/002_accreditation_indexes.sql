-- Indexes die v1 mist. Allemaal CONCURRENTLY in productie.
-- Voor lokaal `supabase db reset` mag CONCURRENTLY weg, voor staging/prod
-- moet deze migration in een aparte transactionless run lopen.

create index if not exists idx_acc_persons_project_status
  on accreditation_persons (project_id, status)
  where status = 'draft';

create index if not exists idx_acc_persons_group
  on accreditation_persons (group_id, status);

create index if not exists idx_acc_persons_qr_token
  on accreditation_persons (qr_token);

create index if not exists idx_acc_person_items_issued
  on accreditation_person_items (person_id, issued)
  where issued = false;

create index if not exists idx_acc_person_items_type_day
  on accreditation_person_items (item_type_id, day);

create index if not exists idx_acc_scan_log_project_time
  on accreditation_scan_log (scanned_at desc);

create index if not exists idx_acc_groups_invite_token
  on accreditation_groups (invite_token);
