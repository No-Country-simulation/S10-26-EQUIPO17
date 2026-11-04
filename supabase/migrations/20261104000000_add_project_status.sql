-- Review state of a project: an admin accepts or rejects each uploaded project.
-- Existing and new projects start as pending.
alter table public.projects
  add column status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

create index projects_status_idx on public.projects (status);