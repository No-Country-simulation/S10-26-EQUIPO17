-- Finish translating public.users to English, matching companies.created_at.
alter table public.users rename column creado_en to created_at;
