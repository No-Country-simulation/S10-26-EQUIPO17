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
    raise exception 'PROJECT_EDIT_REQUEST_ALREADY_REVIEWED'
      using errcode = 'P0001';
  end if;

  if p_decision = 'approve' then
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
      raise exception 'ORIGINAL_PROJECT_NOT_FOUND'
        using errcode = 'P0001';
    end if;

    update public.project_edit_requests
      set
        status = 'approved',
        reviewed_by_user_id = p_reviewer_id,
        reviewed_at = p_reviewed_at,
        rejection_reason = null
      where id = p_request_id;
  else
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

-- Reassert the intended execution permissions.
revoke all on function public.review_project_edit_request(
  uuid, uuid, text, timestamptz, text
) from public, anon, authenticated;

grant execute on function public.review_project_edit_request(
  uuid, uuid, text, timestamptz, text
) to service_role;