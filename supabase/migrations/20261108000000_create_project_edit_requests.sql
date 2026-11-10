create table public.project_edit_requests (
  id uuid primary key,

  project_id uuid not null
    references public.projects (id) on delete cascade,

  company_id uuid not null
    references public.companies (id) on delete cascade,

  requested_by_user_id uuid not null
    references public.users (id),

  proposed_title text not null,
  proposed_description text not null,
  proposed_vertical text not null,
  proposed_business_sectors text[] not null,
  proposed_project_stage text not null,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),

  created_at timestamptz not null default now(),

  reviewed_by_user_id uuid
    references public.users (id),

  reviewed_at timestamptz,

  rejection_reason text,

  constraint project_edit_requests_review_state_check
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
        and reviewed_by_user_id is not null
        and reviewed_at is not null
        and rejection_reason is null
      )
      or
      (
        status = 'rejected'
        and reviewed_by_user_id is not null
        and reviewed_at is not null
      )
    ),

  constraint project_edit_requests_business_sectors_check
    check (cardinality(proposed_business_sectors) > 0)
);

-- A project can have only one pending edit request at a time.
create unique index project_edit_requests_one_pending_per_project_idx
  on public.project_edit_requests (project_id)
  where status = 'pending';

create index project_edit_requests_pending_created_at_idx
  on public.project_edit_requests (created_at)
  where status = 'pending';

-- Only the backend API should access this table.
alter table public.project_edit_requests enable row level security;



create or replace function public.review_project_edit_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_reviewed_at timestamptz,
  p_rejection_reason text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_request public.project_edit_requests%rowtype;
begin
  if p_decision is null
     or p_decision not in ('approve', 'reject') then
    raise exception 'Invalid review decision'
      using errcode = '22023';
  end if;

  if p_reviewer_id is null or p_reviewed_at is null then
    raise exception 'Reviewer and review date are required'
      using errcode = '22023';
  end if;

  -- Lock the request to prevent simultaneous reviews.
  select *
    into v_request
    from public.project_edit_requests
    where id = p_request_id
    for update;

  if not found then
    raise exception 'Project edit request not found'
      using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'This request has already been reviewed'
      using errcode = '23505';
  end if;

  if p_decision = 'approve' then

    -- Apply the proposed information to the original project.
    update public.projects
      set
        title = v_request.proposed_title,
        description = v_request.proposed_description,
        vertical = v_request.proposed_vertical,
        business_sectors = v_request.proposed_business_sectors,
        project_stage = v_request.proposed_project_stage
      where id = v_request.project_id
        and company_id = v_request.company_id;

    if not found then
      raise exception 'Original project not found'
        using errcode = 'P0002';
    end if;

    update public.project_edit_requests
      set
        status = 'approved',
        reviewed_by_user_id = p_reviewer_id,
        reviewed_at = p_reviewed_at,
        rejection_reason = null
      where id = p_request_id;

  else

    -- Rejection leaves the original project unchanged.
    update public.project_edit_requests
      set
        status = 'rejected',
        reviewed_by_user_id = p_reviewer_id,
        reviewed_at = p_reviewed_at,
        rejection_reason = nullif(trim(p_rejection_reason), '')
      where id = p_request_id;

  end if;
end;
$function$;


-- Only the backend service role can execute the review function.
revoke all on function public.review_project_edit_request(
  uuid, uuid, text, timestamptz, text
) from public, anon, authenticated;

grant execute on function public.review_project_edit_request(
  uuid, uuid, text, timestamptz, text
) to service_role;