# 🚀 Guía de Despliegue del Frontend - S10-26-EQUIPO17

Este documento detalla la arquitectura, configuración y automatización utilizadas para el despliegue del frontend (**React + Vite**) alojado en este monorepo administrado con **pnpm workspaces**.

---

## 📋 Parámetros de Configuración en Vercel

Debido a que el frontend se encuentra dentro de la carpeta `/apps/web` del monorepo, el proyecto en el panel de **Vercel** debe importarse con los siguientes ajustes específicos:

* **Root Directory (Directorio Raíz):** `apps/web`
* **Build Command (Comando de Compilación):** `pnpm --filter web build`
* **Install Command (Comando de Instalación):** `pnpm install`
* **Output Directory (Directorio de Salida):** `dist`

---

## 🔐 Variables de Entorno (Environment Variables)

**PostHog (analítica):** define en Vercel (Preview y Production) `VITE_POSTHOG_KEY` (clave pública `phc_...` del proyecto) y `VITE_POSTHOG_HOST` (host de la región del proyecto, p. ej. `https://us.i.posthog.com`). Sin `VITE_POSTHOG_KEY` el tracking queda desactivado. En local van en `apps/web/.env` (ver `apps/web/.env.example`). Las variables `VITE_*` se incrustan en el build, así que hay que redeployar tras cambiarlas.

El cliente HTTP (`src/shared/api/apiClient.ts`) llama por defecto a `/api` en el mismo origen de la web, así que **no hace falta definir `VITE_API_URL`** en Vercel. Si se define, tiene que ser `/api`: una URL absoluta a la EC2 haría que las cookies de sesión pasen a ser de terceros (ver la sección siguiente).

---

## 🛣️ Enrutamiento y Soporte para Single Page Application (SPA)

`apps/web/vercel.json` tiene dos reglas de reescritura. Vercel las evalúa en orden, así que el proxy de la API tiene que ir antes que el catch-all de la SPA:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://ec2-host-pendiente.invalid/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

1. **Proxy de la API:** Vercel reenvía `/api/*` a la API en la EC2. El navegador ve la API en el mismo origen que la web, así que las cookies de sesión son de primera parte: `SameSite=Lax` frena el CSRF, Safari y Firefox no las bloquean y la API no necesita CORS. ⚠️ Hay que reemplazar `ec2-host-pendiente.invalid` por el host HTTPS real de la EC2. En desarrollo, el `server.proxy` de `vite.config.ts` hace lo mismo contra `http://127.0.0.1:3000`.
2. **Catch-all de la SPA:** para solucionar el comportamiento nativo de los servidores en la nube que arrojan errores `404 NOT FOUND` al recargar páginas manualmente o acceder de forma directa a rutas profundas (por ejemplo, `/cargar-desafio`), todo lo demás se redirige al archivo central `index.html` para que **React Router** tome el control de la navegación en el cliente.

---

## 🔄 Flujo de Integración y Despliegue Continuo (CI/CD)

El repositorio combina la potencia de GitHub Actions para asegurar la calidad del código junto con el motor automatizado de Vercel para la gestión de entornos de lanzamiento.

### 1. Validación de Calidad (GitHub Actions)
Cada vez que se realiza un *push* o se abre un *Pull Request* hacia la rama `main`, el workflow `.github/workflows/frontend-ci.yml` ejecuta de forma automática las siguientes fases sobre un entorno con **Node.js 22**:
* **Instalación:** Inicializa las dependencias globales utilizando las ventajas de velocidad de `pnpm --frozen-lockfile`.
* **Linting:** Ejecuta `pnpm --filter web lint` para garantizar que el código cumpla con los estándares estáticos definidos.
* **Typechecking:** Corre `pnpm --filter web typecheck` para asegurar la integridad de los tipos de TypeScript.
* **Build Test:** Ejecuta `pnpm --filter web build` para confirmar que el compilador de Vite no genere artefactos rotos antes de proceder a la integración.

### 2. Ciclo de Vida de Lanzamientos en Vercel
* **Preview Deployments (Entornos de Pruebas):** Cualquier rama de desarrollo secundaria (como `dashboard-publico`) enviada mediante un *push* genera de manera inmediata una URL de vista previa única y aislada. Esto permite probar nuevas funciones en tiempo real antes de incorporarlas al tronco común del proyecto.
* **Production Deployment (Entorno de Producción):** Una vez superadas las pruebas y habiendo completado la fusión (*merge*) del Pull Request hacia la rama `main` del repositorio oficial, Vercel compila e impacta los cambios de forma automática sobre el dominio de producción global de la organización.
