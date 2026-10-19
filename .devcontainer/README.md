# Entorno de desarrollo (Dev Container)

## Requisitos

- Docker: Docker Engine en Linux, o Docker Desktop en Mac y Windows.
- VS Code con la extensión **Dev Containers** (`ms-vscode-remote.remote-containers`).
- **Windows:** cloná el repo _dentro de WSL2_ (p. ej. `~/proyectos/...`) y abrilo desde ahí
  (`code .` en WSL). Si lo clonás en `C:\...`, el montaje en la misma ruta no funciona
  y además todo anda mucho más lento.

## Estructura

Monorepo con pnpm workspaces (`pnpm-workspace.yaml`):

- Raíz: Supabase CLI (devDependency) y la carpeta `supabase/`.
- `apps/web/`: la app de React + Vite.
- `apps/api/`: el backend en Node.js (cliente de Supabase).
- `packages/shared/`: código compartido entre apps.

El contenedor corre `pnpm install` en la raíz solo al crearse, y eso instala todo el workspace.
Las dependencias se agregan en cada app: `pnpm --filter web add ...` o `pnpm --filter api add ...`.

## Uso diario

1. Abrí la carpeta en VS Code → `Dev Containers: Reopen in Container`.
2. En la terminal del contenedor:
   ```bash
   pnpm supabase start      # levanta Supabase en el Docker de tu máquina
   pnpm supabase status     # URL de la API, claves y URL de Studio
   cp .env.example .env     # la primera vez: completá SUPABASE_URL y SUPABASE_SECRET_KEY
   pnpm dev                 # API (puerto 3000) + Vite (puerto 5173)
   ```
3. Studio: http://127.0.0.1:54323 · App y API: los puertos 5173 y 3000 en la pestaña **Ports** de VS Code.

## Cómo está armado

- Los contenedores de Supabase **no** corren dentro del dev container: corren al lado,
  en el Docker de tu máquina (feature `docker-outside-of-docker`).
- **Navegador → Supabase:** `http://127.0.0.1:54321` (puertos que publica Docker en tu máquina).
- **Código que corre dentro del contenedor → Supabase** (la API, tests, scripts de Node, `psql`):
  usá `host.docker.internal` en vez de `127.0.0.1`, p. ej.
  `SUPABASE_URL=http://host.docker.internal:54321` o
  `psql postgresql://postgres:postgres@host.docker.internal:54322/postgres`.
- El CLI ya sabe esto gracias a `SUPABASE_SERVICES_HOSTNAME=host.docker.internal`.
- Por eso `pnpm supabase status` muestra todas las URLs con `host.docker.internal`. **Es lo esperado.**
  Esas URLs sirven dentro del contenedor, pero tu máquina puede no resolver ese nombre (en Linux nunca lo resuelve; en Windows y Mac depende de la configuración de Docker Desktop). Para abrirlas en el navegador reemplazá host.docker.internal por 127.0.0.1 (Studio: http://127.0.0.1:54323, API: http://127.0.0.1:54321).
- El código del **front** corre en el navegador, no en el contenedor: la URL de Supabase
  que use la app de React tiene que ser `http://127.0.0.1:54321`, nunca `host.docker.internal`.
- El Supabase CLI se actualiza como cualquier dependencia: `pnpm up -w supabase`.
  Tiene que ser una versión de mayo 2026 o posterior, que es cuando se agregó
  `SUPABASE_SERVICES_HOSTNAME`.

## Problemas comunes

- **No carga Vite desde la pestaña Ports.** Dentro del contenedor `localhost` resuelve a `::1`
  (IPv6), mientras que el reenvío de puertos de VS Code se conecta a `127.0.0.1` (IPv4).
  Por eso `apps/web/vite.config.ts` fija `server.host: '127.0.0.1'`: Vite escucha solo en el
  loopback del contenedor, sin quedar expuesto en el host. Para revisarlo:
  `ss -ltn | grep 5173` tiene que mostrar `127.0.0.1:5173`.

## Cambios en la base

- Todo cambio de esquema va como migración en `supabase/migrations/`:
  `pnpm supabase migration new nombre` (a mano) o `pnpm supabase db diff -f nombre` (desde Studio).
- Probar con `pnpm supabase db reset` antes de commitear.
- **Nunca** cambiar tablas a mano en el dashboard de producción.
