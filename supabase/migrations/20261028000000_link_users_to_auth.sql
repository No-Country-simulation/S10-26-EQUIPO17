-- Users now live in auth.users (Supabase Auth). public.users mirrors them so other
-- tables (companies) can reference users through the auto-generated API.
-- The API reads these names in apps/api/src/adapters/out/persistence/supabase/filas.ts.

-- Existing rows have no auth.users counterpart and their scrypt hashes cannot be
-- imported into Supabase Auth, so they are discarded.
update public.companies set user_id = null where user_id is not null;
delete from public.users;

alter table public.users drop column password_hash;
alter table public.users
  add constraint users_id_fkey foreign key (id) references auth.users (id) on delete cascade;

-- security definer: the trigger runs as the function owner, which can write public.users.
-- Empty search_path: every name below is schema-qualified.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
