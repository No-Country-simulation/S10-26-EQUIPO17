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

Para permitir que el cliente de React se comunique de forma dinámica con la API en entornos de desarrollo y producción, se debe dar de alta la siguiente variable en el panel web de Vercel (**Settings > Environment Variables**):

* **Key:** `VITE_API_URL`
* **Value:** URL pública real del servidor backend de producción (ej. `https://tuproyecto.com`).
* *Nota:* En el código, esta variable es consumida de forma segura mediante `import.meta.env.VITE_API_URL` dentro del cliente HTTP.

---

## 🛣️ Enrutamiento y Soporte para Single Page Application (SPA)

Para solucionar el comportamiento nativo de los servidores en la nube que arrojan errores `404 NOT FOUND` al recargar páginas manualmente o acceder de forma directa a rutas profundas (por ejemplo, `/cargar-desafio`), se implementó una regla de reescritura en la raíz del frontend (`apps/web/vercel.json`):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Esto fuerza a Vercel a redirigir todas las peticiones entrantes al archivo central `index.html` para que **React Router** tome el control de la navegación en el cliente.

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
