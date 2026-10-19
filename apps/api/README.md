# API

Backend en **Node.js + TypeScript + Express**, organizado con **Clean Architecture**. Las dos capas
externas siguen el enfoque **hexagonal (puertos y adaptadores)**.

## Capas

```
src/
├── domain/                 1. Entidades: reglas de negocio puras
│   ├── entities/           Usuario, Empresa
│   ├── value-objects/      Correo
│   ├── errors.ts           ValidacionError, NoEncontradoError, ConflictoError
│   └── validaciones.ts
├── application/            2. Casos de uso
│   ├── use-cases/          RegistrarUsuario, CrearEmpresa, ObtenerEmpresa
│   └── ports/
│       ├── in/             Lo que la aplicación ofrece (interfaces de los casos de uso)
│       └── out/            Lo que la aplicación necesita (repositorios, hasher, ids)
├── adapters/               3. Adaptadores de interfaz
│   ├── in/http/            Adaptador primario: rutas Express, lectura del body, DTOs, errores → HTTP
│   └── out/                Adaptadores secundarios: implementan ports/out
│       ├── persistence/supabase/
│       ├── persistence/memory/
│       ├── security/       Hash de claves con scrypt
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
| POST   | `/usuarios`     | `{ "correo", "clave" }`                             | `201 { id, correo }` (la clave nunca se devuelve) |
| POST   | `/empresas`     | `{ "nombre", "pais", "usuarioId"? }`                | `201 { id, nombre, pais, usuario }`           |
| GET    | `/empresas/:id` | —                                                   | `200 { id, nombre, pais, usuario }`           |

Errores: `{ "error": "mensaje" }` con `400` (validación o JSON mal formado), `404` (no existe) o
`409` (correo ya registrado).

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
