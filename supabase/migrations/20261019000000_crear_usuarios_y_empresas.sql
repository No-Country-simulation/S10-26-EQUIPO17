-- Tablas del adaptador de persistencia de Supabase (apps/api/src/adapters/out/persistence/supabase).
-- Los ids los genera la API (puerto GeneradorDeIds), por eso no tienen default.

create table public.usuarios (
  id uuid primary key,
  correo text not null unique,
  clave_hash text not null,
  creado_en timestamptz not null default now()
);

create table public.empresas (
  id uuid primary key,
  nombre text not null,
  pais text not null,
  usuario_id uuid references public.usuarios (id) on delete set null,
  creado_en timestamptz not null default now()
);

create index empresas_usuario_id_idx on public.empresas (usuario_id);

-- RLS activado y sin políticas: con la clave publicable (anon) no se puede leer ni escribir.
-- Solo la API accede, con la clave secreta, que saltea RLS.
alter table public.usuarios enable row level security;
alter table public.empresas enable row level security;
