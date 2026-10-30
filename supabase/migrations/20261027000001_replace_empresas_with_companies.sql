-- Replace empresas with companies. Existing empresas rows are discarded on purpose:
-- the new required columns (first_name, last_name, job_position) have no source data.
-- The API reads these names in apps/api/src/adapters/out/persistence/supabase/filas.ts.

drop table public.empresas;

create table public.companies (
  id uuid primary key,
  first_name text not null,
  last_name text not null,
  job_position text not null,
  company_name text not null,
  -- Allowed values are validated by the domain enums (Country, BusinessSector, ExplorationInterest).
  country text not null,
  business_sector text not null,
  interests text[] not null,
  user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index companies_user_id_idx on public.companies (user_id);

-- RLS on with no policies: only the API, using the secret key, can access the table.
alter table public.companies enable row level security;
