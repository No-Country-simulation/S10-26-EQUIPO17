-- Companies now declare an organization type instead of exploration interests.
-- Existing rows default to 'Company'.
alter table public.companies drop column interests;

alter table public.companies
  add column organization_type text not null default 'Company'
  check (organization_type in ('StartUp', 'Educational Institute', 'Company'));
