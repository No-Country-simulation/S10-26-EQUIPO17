# API

Backend en **Node.js + TypeScript + Express**, organizado con **Clean Architecture**. Las dos capas
externas siguen el enfoque **hexagonal (puertos y adaptadores)**.

## Capas

```
src/
├── domain/                 1. Entidades: reglas de negocio puras
│   ├── entities/           User, Company, Project, Country, BusinessSector, OrganizationType, Vertical, ProjectStage
│   ├── value-objects/      Email, UserRole
│   ├── errors.ts           ValidacionError, NoEncontradoError, ConflictoError, CredencialesInvalidasError, NoAutenticadoError, AccesoDenegadoError
│   └── validaciones.ts
├── application/            2. Casos de uso
│   ├── use-cases/          RegisterCompany, LogIn, RefreshUserSession, LogOut, Authenticate, UploadProject
│   └── ports/
│       ├── in/             Lo que la aplicación ofrece (interfaces de los casos de uso)
│       └── out/            Lo que la aplicación necesita (repositorios, autenticación, ids)
├── adapters/               3. Adaptadores de interfaz
│   ├── in/http/            Adaptador primario: rutas Express, autenticación por cookie, lectura del body, DTOs, errores → HTTP
│   └── out/                Adaptadores secundarios: implementan ports/out
│       ├── persistence/supabase/
│       ├── persistence/memory/
│       ├── auth/           Registro, baja, login, renovación y cierre de sesión y validación de tokens en Supabase Auth (y su doble en memoria)
│       └── ids/            UUID
├── infrastructure/         4. Frameworks y drivers
│   ├── config/env.ts       Lectura y validación de variables de entorno
│   ├── supabase/client.ts  Cliente de Supabase
│   ├── http/app.ts         Instancia de Express
│   └── container.ts        Composition root: conecta adaptadores con puertos
└── index.ts                Arranque
```

### Regla de dependencias

Los `import` solo pueden apuntar **hacia adentro**: `infrastructure → adapters → application → domain`.

- `domain/` no importa nada de afuera, ni Express, ni Supabase, ni `node:*`.
- `application/` solo importa de `domain/`. Para hablar con el exterior **define un puerto** en
  `ports/out/` y lo recibe por constructor. Nunca importa un adaptador.
- `adapters/` implementan esos puertos o llaman a los casos de uso a través de `ports/in/`.
- `infrastructure/container.ts` es el único lugar que instancia clases concretas.

### Agregar una funcionalidad

1. Entidad o value object en `domain/`, si hace falta.
2. Puerto de entrada en `application/ports/in/` y caso de uso en `application/use-cases/`.
3. Si el caso de uso necesita algo externo, un puerto en `application/ports/out/`.
4. Implementar el puerto en `adapters/out/` (Supabase y, para los tests, en memoria).
5. Exponerlo en `adapters/in/http/` y conectarlo en `infrastructure/container.ts` y `http/app.ts`.
6. Tests del caso de uso con los adaptadores en memoria.

## Endpoints

| Método | Ruta            | Body                                                | Respuesta                                     |
| ------ | --------------- | --------------------------------------------------- | --------------------------------------------- |
| GET    | `/api`          | —                                                   | `{"status":"ok"}`                             |
| POST   | `/api/companies/register` | `{ "email", "password", "firstName", "lastName", "jobPosition", "companyName", "country", "businessSector", "organizationType" }` | `201 { id, firstName, lastName, jobPosition, companyName, country, businessSector, organizationType, user }` |
| POST   | `/api/auth/login` | `{ "email", "password" }`                         | `200 { user: { id, email, role } }` + cookies de sesión |
| POST   | `/api/auth/refresh` | Sin body; usa la cookie `refresh_token`         | `200 { user: { id, email, role } }` + cookies de sesión nuevas |
| POST   | `/api/auth/logout` | Sin body; usa la cookie `access_token`           | `204` + borra las cookies de sesión |
| POST   | `/api/projects` (requiere sesión de company) | `{ "title", "description", "vertical", "businessSectors", "projectStage" }` | `201 { id, companyId, title, description, vertical, businessSectors, projectStage }` |

Todas las rutas viven bajo `/api` (`API_PREFIX` en `adapters/in/http/api-prefix.ts`).

Errores: `{ "error": "mensaje" }` con `400` (validación o JSON mal formado), `401` (email o
contraseña incorrectos, o sesión faltante o inválida), `403` (sin permiso para la operación),
`404` (ruta inexistente) o `409` (email ya registrado).

### Registro de una company

`POST /api/companies/register` crea el usuario y la company en una sola request:

1. Valida el email, la contraseña y todos los datos de la company antes de crear nada.
2. Crea el usuario en Supabase Auth con `app_metadata.role = "company"`.
3. Guarda la company vinculada a ese usuario.
4. Si la company no se puede guardar, elimina el usuario para no dejarlo sin rol.

Es el único endpoint de registro y la única forma de crear una company: no se puede crear una
company sin usuario ni vincularla a un usuario existente.

### Sesión

`POST /api/auth/login` devuelve el usuario con su `role` (`"company"` o `null` si no tiene uno), para
que el frontend decida qué mostrar. La autorización la sigue haciendo la API.

Los tokens no van en el body: se guardan en cookies `HttpOnly`, que el JavaScript del frontend no
puede leer.

| Cookie          | `Path`  | Duración                     |
| --------------- | ------- | ---------------------------- |
| `access_token`  | `/api`      | La del JWT de Supabase (1 h) |
| `refresh_token` | `/api/auth` | 30 días desde el último refresh |

`Secure` y `SameSite` se configuran con `COOKIE_SECURE` y `COOKIE_SAME_SITE` (ver el README de la
raíz). Un email desconocido y una contraseña incorrecta devuelven el mismo `401`, así no se revela
qué emails están registrados.

### Renovar la sesión

`POST /api/auth/refresh` cambia la cookie `refresh_token` por una sesión nueva y devuelve lo mismo que
el login. No pide el access token, porque se usa justamente cuando ya venció.

Supabase rota el refresh token, así que la respuesta reescribe las dos cookies. Como la cookie
`refresh_token` se renueva, los 30 días cuentan desde el último refresh: una sesión en uso no vence.

Sin cookie, o con un token que Supabase rechaza, responde `401` y borra las dos cookies, porque esa
sesión ya no sirve. Si Supabase Auth no está disponible responde `500` y las conserva, para poder
reintentar: una caída no cierra la sesión.

### Cerrar la sesión

`POST /api/auth/logout` revoca en Supabase la sesión de la cookie `access_token`, con su refresh
token. Las otras sesiones del usuario, por ejemplo en otro navegador, siguen abiertas.

Siempre responde `204` y borra las dos cookies, así que cerrar una sesión ya cerrada no es un error.
Tampoco pide una sesión válida:

- Sin cookie, o con un access token vencido o inválido, borra las cookies sin llamar a Supabase o
  ignorando su rechazo. Supabase solo revoca con un access token válido: si ya venció, el refresh
  token sigue sirviendo del lado de Supabase, aunque el navegador ya no lo tenga.
- Si Supabase Auth no está disponible, borra las cookies igual y deja el error en la consola de la
  API: una caída no deja al usuario con la sesión abierta en el navegador.

### Rutas protegidas

El middleware `autenticar` (`adapters/in/http/autenticar.ts`) lee la cookie `access_token` y le
pregunta a Supabase Auth de quién es, con `auth.getUser(token)`. Sin cookie, o con un token inválido,
expirado o revocado, responde `401`. Si Supabase Auth no está disponible responde `500`: una caída no
se informa como sesión cerrada.

El middleware solo dice quién llama. Qué puede hacer lo decide cada caso de uso.

### Subir un proyecto

`POST /api/projects` recibe solo JSON, sin archivos adjuntos:

1. `autenticar` valida la sesión.
2. Si el rol no es `company`, o el usuario no tiene una company, responde `403`.
3. Crea el proyecto a nombre de la company del usuario y lo guarda.

El `companyId` sale de la sesión y nunca del body, así nadie puede publicar por otra company.

### Proxy: la web y la API en el mismo origen

La web (Vercel) y la API (EC2) están en sitios distintos. Para que las cookies de sesión sean de
primera parte, el navegador nunca le habla directo a la API: siempre pide `/api/*` al origen de la
web y un proxy lo reenvía.

| Entorno    | Proxy                                         | Destino                  |
| ---------- | --------------------------------------------- | ------------------------ |
| Desarrollo | `server.proxy` en `apps/web/vite.config.ts`   | `http://127.0.0.1:3000`  |
| Producción | `rewrites` en `apps/web/vercel.json`, antes del catch-all de la SPA | La EC2, por HTTPS |

Así:

- `SameSite=Lax` frena el CSRF: un formulario de otro sitio llega sin cookies.
- Safari y Firefox no bloquean las cookies, porque no son de terceros.
- La API no habilita CORS: ningún request legítimo es cross-origin, así que ningún otro origen
  puede leer respuestas hechas con la sesión del usuario.
- El tramo Vercel → EC2 lleva los tokens, así que la EC2 tiene que servir HTTPS.

Con `SameSite=None` hará falta una protección propia contra CSRF.

### Login y refresh en Supabase

El login y el refresh en Supabase se hacen con un cliente nuevo por request. Ambos guardan la sesión en
el cliente, y las consultas siguientes se harían como ese usuario: por eso nunca se usa el cliente
compartido con la clave secreta.

## Persistencia

`PERSISTENCIA=supabase` (por defecto) usa las tablas de `supabase/migrations/`. Se aplican con
`pnpm supabase db reset` o `pnpm supabase migration up`. Las tablas tienen RLS sin políticas, así que
la API usa `SUPABASE_SECRET_KEY`.

`PERSISTENCIA=memoria` cambia el adaptador por uno en memoria. Sirve para levantar la API sin
Supabase, por ejemplo para trabajar en el frontend. Los datos se pierden al reiniciar.

## Scripts

| Comando                        | Acción                                         |
| ------------------------------ | ---------------------------------------------- |
| `pnpm --filter api dev`        | `tsx watch` con el `.env` de la raíz.          |
| `pnpm --filter api build`      | Compila a `dist/`.                             |
| `pnpm --filter api start`      | Ejecuta `dist/index.js`.                       |
| `pnpm --filter api typecheck`  | `tsc` sin emitir (incluye los tests).          |
| `pnpm --filter api test`       | Tests con `node:test`.                         |
