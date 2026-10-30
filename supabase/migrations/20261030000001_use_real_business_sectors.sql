-- Business sectors switch from example values to the real ones.
-- Existing rows with an old value move to 'IT'.
update public.companies
  set business_sector = 'IT'
  where business_sector not in ('Product', 'IT', 'Marketing', 'Software Development');

alter table public.companies
  add constraint companies_business_sector_check
  check (business_sector in ('Product', 'IT', 'Marketing', 'Software Development'));
