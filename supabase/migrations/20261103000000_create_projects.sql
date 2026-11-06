-- Projects uploaded by companies.
-- The API reads these names in apps/api/src/adapters/out/persistence/supabase/filas.ts.

create table public.projects (
  id uuid primary key,
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  description text not null,
  -- Allowed values are validated by the domain enums (Vertical, BusinessSector, ProjectStage).
  vertical text not null,
  business_sectors text[] not null,
  project_stage text not null,
  created_at timestamptz not null default now()
);

create index projects_company_id_idx on public.projects (company_id);

-- RLS on with no policies: only the API, using the secret key, can access the table.
alter table public.projects enable row level security;
