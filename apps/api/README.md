# API

Backend en **Node.js + TypeScript + Express**, organizado con **Clean Architecture**. Las dos capas
externas siguen el enfoque **hexagonal (puertos y adaptadores)**.

## Capas

```
src/
├── domain/                 1. Entidades: reglas de negocio puras
│   ├── entities/           User, Company, Country, BusinessSector, OrganizationType
│   ├── value-objects/      Email, UserRole
│   ├── errors.ts           ValidacionError, NoEncontradoError, ConflictoError, CredencialesInvalidasError
│   └── validaciones.ts
├── application/            2. Casos de uso
│   ├── use-cases/          RegisterCompany, LogIn
│   └── ports/
│       ├── in/             Lo que la aplicación ofrece (interfaces de los casos de uso)
│       └── out/            Lo que la aplicación necesita (repositorios, autenticación, ids)
├── adapters/               3. Adaptadores de interfaz
│   ├── in/http/            Adaptador primario: rutas Express, lectura del body, DTOs, errores → HTTP
│   └── out/                Adaptadores secundarios: implementan ports/out
│       ├── persistence/supabase/
│       ├── persistence/memory/
│       ├── auth/           Registro, baja y login en Supabase Auth (y su doble en memoria)
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
| GET    | `/`             | —                                                   | `{"status":"ok"}`                             |
| POST   | `/companies/register` | `{ "email", "password", "firstName", "lastName", "jobPosition", "companyName", "country", "businessSector", "organizationType" }` | `201 { id, firstName, lastName, jobPosition, companyName, country, businessSector, organizationType, user }` |
| POST   | `/auth/login`   | `{ "email", "password" }`                           | `200 { user: { id, email, role } }` + cookies de sesión |

Errores: `{ "error": "mensaje" }` con `400` (validación o JSON mal formado), `401` (email o
contraseña incorrectos), `404` (ruta inexistente) o `409` (email ya registrado).

### Registro de una company

`POST /companies/register` crea el usuario y la company en una sola request:

1. Valida el email, la contraseña y todos los datos de la company antes de crear nada.
2. Crea el usuario en Supabase Auth con `app_metadata.role = "company"`.
3. Guarda la company vinculada a ese usuario.
4. Si la company no se puede guardar, elimina el usuario para no dejarlo sin rol.

Es el único endpoint de registro y la única forma de crear una company: no se puede crear una
company sin usuario ni vincularla a un usuario existente.

### Sesión

`POST /auth/login` devuelve el usuario con su `role` (`"company"` o `null` si no tiene uno), para
que el frontend decida qué mostrar. La autorización la sigue haciendo la API.

Los tokens no van en el body: se guardan en cookies `HttpOnly`, que el JavaScript del frontend no
puede leer.

| Cookie          | `Path`  | Duración                     |
| --------------- | ------- | ---------------------------- |
| `access_token`  | `/`     | La del JWT de Supabase (1 h) |
| `refresh_token` | `/auth` | 30 días                      |

`Secure` y `SameSite` se configuran con `COOKIE_SECURE` y `COOKIE_SAME_SITE` (ver el README de la
raíz). Un email desconocido y una contraseña incorrecta devuelven el mismo `401`, así no se revela
qué emails están registrados.

### CORS

La web y la API van en dominios distintos, así que el navegador solo deja que el frontend lea las
respuestas si la API lo autoriza. Solo los orígenes de `CORS_ORIGINS` reciben
`Access-Control-Allow-Origin` (su propio origen, nunca `*`) y `Access-Control-Allow-Credentials`.
El frontend tiene que hacer los `fetch` con `credentials: "include"` para recibir y mandar las
cookies.

Cualquier origen autorizado puede leer respuestas hechas con la sesión del usuario. Por eso la
lista se compara por igualdad exacta y al arrancar se rechazan `*`, `null`, comodines, paths y
barras finales. CORS no frena CSRF: hoy lo cubre `SameSite=Lax`. Con `SameSite=None` hará falta
una protección propia.

### Login en Supabase

El login en Supabase se hace con un cliente nuevo por request. Iniciar sesión guarda la sesión en
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
