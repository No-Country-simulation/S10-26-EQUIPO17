-- Preserve edit request history when the requesting user is deleted.
alter table public.project_edit_requests
  alter column requested_by_user_id drop not null;

-- Replace the requester FK with ON DELETE SET NULL.
alter table public.project_edit_requests
  drop constraint if exists project_edit_requests_requested_by_user_id_fkey;

alter table public.project_edit_requests
  add constraint project_edit_requests_requested_by_user_id_fkey
  foreign key (requested_by_user_id)
  references public.users (id)
  on delete set null;

-- Replace the reviewer FK with ON DELETE SET NULL.
alter table public.project_edit_requests
  drop constraint if exists project_edit_requests_reviewed_by_user_id_fkey;

alter table public.project_edit_requests
  add constraint project_edit_requests_reviewed_by_user_id_fkey
  foreign key (reviewed_by_user_id)
  references public.users (id)
  on delete set null;

-- A reviewed request must retain its review date, but its reviewer
-- may subsequently be deleted.
alter table public.project_edit_requests
  drop constraint if exists project_edit_requests_review_state_check;

alter table public.project_edit_requests
  add constraint project_edit_requests_review_state_check
  check (
    (
      status = 'pending'
      and reviewed_by_user_id is null
      and reviewed_at is null
      and rejection_reason is null
    )
    or
    (
      status = 'approved'
      and reviewed_at is not null
      and rejection_reason is null
    )
    or
    (
      status = 'rejected'
      and reviewed_at is not null
    )
  );