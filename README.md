# no-country-optimization

Monorepo con frontend en **React + Vite**, backend en **Node.js + TypeScript + Express** y base de datos en **Supabase**,
gestionado con **pnpm workspaces** y preparado para trabajar dentro de un **Dev Container**.

## Inicio rápido

### Con Dev Container (recomendado)

1. Abrir la carpeta en VS Code → `Dev Containers: Reopen in Container`.
2. En la terminal del contenedor:
   ```bash
   pnpm supabase start      # levanta Supabase en el Docker del host
   pnpm supabase status     # muestra URL de la API y claves
   cp .env.example .env     # completar SUPABASE_SECRET_KEY
   pnpm supabase db reset   # aplica las migraciones de supabase/migrations
   pnpm dev                 # API (3000) + Vite (5173)
   ```
3. Verificar: la app en el puerto 5173 y `GET http://localhost:3000` responde `{"status":"ok"}`.

Detalle completo del entorno: [`.devcontainer/README.md`](.devcontainer/README.md).

### Sin Dev Container

Requiere Node.js 22+ y pnpm (vía `corepack enable pnpm`). Mismos pasos que arriba, pero en
`.env` usar `SUPABASE_URL=http://127.0.0.1:54321` en lugar de `host.docker.internal`.

## Estructura

| Ruta               | Contenido                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `apps/web/`        | Frontend React + Vite (TypeScript, oxlint). Plantilla por defecto de `create-vite`.               |
| `apps/api/`        | Backend Express + TypeScript con Clean Architecture y puertos y adaptadores. Ver [`apps/api/README.md`](apps/api/README.md). |
| `packages/shared/` | Código compartido entre apps (vacío por ahora).                                                   |
| `supabase/`        | Configuración local de Supabase (`config.toml`) y migraciones (`migrations/`).                    |
| `.devcontainer/`   | Imagen, configuración y script de inicialización del Dev Container.                               |

## Scripts

Se ejecutan desde la raíz:

| Comando               | Acción                                                   |
| --------------------- | -------------------------------------------------------- |
| `pnpm dev`            | Levanta API y frontend en paralelo.                      |
| `pnpm dev:api`        | Solo la API, con recarga automática y `.env` de la raíz. |
| `pnpm dev:web`        | Solo el frontend (Vite).                                 |
| `pnpm build`          | Compila la API y el frontend.                            |
| `pnpm test`           | Tests de la API.                                         |
| `pnpm typecheck`      | Chequeo de tipos de la API.                              |
| `pnpm lint`           | Ejecuta oxlint en el frontend.                           |
| `pnpm supabase <cmd>` | Supabase CLI (devDependency de la raíz).                 |

Para agregar dependencias a una app: `pnpm --filter web add <paquete>` o `pnpm --filter api add <paquete>`.

## Variables de entorno

Definidas en `.env` (raíz), a partir de `.env.example`:

| Variable                   | Uso                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `PORT`                     | Puerto de la API (por defecto `3000`).                                                 |
| `SUPABASE_URL`             | URL de la API de Supabase. Dentro del contenedor: `http://host.docker.internal:54321`. |
| `PERSISTENCIA`             | `supabase` (por defecto) o `memoria` para correr la API sin base de datos.             |
| `SUPABASE_SECRET_KEY`      | Clave secreta para la API, se obtiene con `pnpm supabase status`. Nunca va al frontend. |

### URLs de Supabase: contenedor vs. navegador

Con el Dev Container, `pnpm supabase status` muestra las URLs con `host.docker.internal`. Es lo
esperado, pero ese nombre solo resuelve dentro del contenedor:

| Desde dónde                                    | URL de Supabase                                             |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Código en el contenedor (API, scripts, `psql`) | `http://host.docker.internal:54321`                         |
| Navegador (Studio, app de React)               | `http://127.0.0.1:54321` · Studio: `http://127.0.0.1:54323` |

La app de React corre en el navegador, así que debe usar `127.0.0.1`, nunca `host.docker.internal`.

## Decisiones tomadas

| Tema                   | Decisión                                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gestor de paquetes     | pnpm `10.34.6`, fijado en `packageManager`, para alinearse con el Dev Container de referencia.                                                                                          |
| Supabase CLI           | Instalado como devDependency en la raíz; se usa con `pnpm supabase`.                                                                                                                    |
| Backend                | Express 5 + TypeScript, con Clean Architecture y puertos y adaptadores en las capas externas. Ver [`apps/api/README.md`](apps/api/README.md).                                    |
| Acceso a Supabase      | Solo desde la API con la clave secreta. Las tablas tienen RLS sin políticas, así que la clave publicable no puede leerlas.                                                     |
| Supabase en desarrollo | Corre en el Docker del host (`docker-outside-of-docker`), no dentro del contenedor.                                                                                                     |
| Vite en el contenedor  | Escucha en `127.0.0.1` (`server.host`) para que funcione el reenvío de puertos de VS Code sin exponerlo en el host. Ver [problemas comunes](.devcontainer/README.md#problemas-comunes). |

## Pendiente

- [x] Tests unitarios de la API (`node:test`).
- [ ] Tests e2e con Playwright.
- [ ] CI en GitHub Actions (build y validación de migraciones).
