-- Translate the users table and its references to English.
-- Renames keep existing data; the API reads these names in apps/api/src/adapters/out/persistence/supabase/filas.ts.

alter table public.usuarios rename to users;
alter table public.users rename column correo to email;
alter table public.users rename column clave_hash to password_hash;
alter table public.users rename constraint usuarios_pkey to users_pkey;
alter table public.users rename constraint usuarios_correo_key to users_email_key;

alter table public.empresas rename column usuario_id to user_id;
alter table public.empresas rename constraint empresas_usuario_id_fkey to empresas_user_id_fkey;
alter index public.empresas_usuario_id_idx rename to empresas_user_id_idx;
