# Analítica del frontend con PostHog

El frontend centraliza los eventos personalizados en [`analytics.ts`](./src/shared/analytics/analytics.ts).
`initAnalytics()` inicializa PostHog al arrancar la aplicación y `track()` captura los eventos
enumerados en el tipo `AnalyticsEvent`. Sin `VITE_POSTHOG_KEY`, la analítica queda desactivada.
La configuración de variables, host y despliegue está en la sección «Variables de entorno» de [DEPLOYMENT.md](./DEPLOYMENT.md).

La inicialización configura vistas de página al cambiar el historial, perfiles solo para
usuarios identificados y enmascaramiento de entradas en grabaciones de sesión. Además de los
eventos explícitos de este catálogo, PostHog puede generar eventos automáticos según su configuración.

## Eventos de navegación y clic

Un evento de clic indica una interacción, no que la navegación o la operación posterior haya terminado.
Los enlaces públicos del menú desplegable también están disponibles con sesión iniciada;
en ese caso los eventos del navbar incluyen el rol de la sesión.

| Evento | Ubicación y acción | Propiedades explícitas |
| --- | --- | --- |
| `clicked_login` | Navbar: Iniciar sesión. | `location=navbar`, `role=guest` |
| `clicked_upload_project` | Navbar: Subir Proyecto. | `location=navbar`, `role=guest` |
| `clicked_nav_institutions` | Navbar: Para centros de estudio. | `location=navbar`, `role` |
| `clicked_nav_companies` | Navbar: Para Empresas. | `location=navbar`, `role` |
| `clicked_nav_talent` | Navbar: Para profesionales emergentes. | `location=navbar`, `role` |
| `clicked_nav_how_it_works` | Navbar: Cómo funciona. | `location=navbar`, `role` |
| `clicked_nav_public_metrics` | Navbar: Métricas públicas en vivo. | `location=navbar`, `role` |
| `clicked_company_dashboard_nav` | Navbar: Mis proyectos. | `location=navbar`, `role=company` |
| `clicked_admin_dashboard_nav` | Navbar: Panel de administrador. | `location=navbar`, `role=admin` |
| `clicked_validate_project` | Inicio, sección principal: Validar mi proyecto o idea. | `location=hero_section`, `role` |
| `clicked_public_metrics_hero` | Inicio, sección principal: Ver Public Dashboard en Vivo. | `location=hero_section`, `role` |
| `clicked_publish_challenge` | Inicio, sección empresas: Publicar un desafío. | `location=empresas_section`, `role` |
| `clicked_schedule_demo` | Inicio, sección instituciones: Agendar Demo Institucional. | `location=instituciones_section`, `role` |
| `clicked_apply_next_generation` | Inicio, sección talento: Postular a la próxima generación. | `location=talento_section`, `role` |
| `clicked_talent_cta_banner` | Banner final: Participar como profesional emergente. | `location=cta_banner`, `role` |
| `clicked_share_project` | Banner final: Comparte tu Proyecto. | `location=cta_banner`, `role` |
| `clicked_institution` | Banner final: Soy Institución. | `location=cta_banner`, `role` |
| `clicked_upload_as_guest` | Publica tu desafío: Subir como invitado. | `role` |
| `clicked_create_account` | Publica tu desafío: Crear cuenta y comenzar. | `role` |
| `clicked_register_from_login` | Inicio de sesión: Crear cuenta. | `location=login`, `role=guest` |
| `clicked_company_new_project` | Panel de empresa: Subir un proyecto. | `location=company_dashboard`, `role` |
| `opened_company_project` | Panel de empresa: abrir una tarjeta de proyecto. | `role` |
| `started_company_project_edit` | Modal del proyecto: Editar proyecto. | `role=company` |
| `cancelled_company_project_edit` | Modal del proyecto: botón Cancelar edición. No incluye cerrar el modal de otra forma. | `role=company` |
| `opened_admin_edit_review` | Panel de administrador: abrir la confirmación de Aceptar o Rechazar. | `role=admin`, `decision` |

## Eventos de resultado y del formulario

Los eventos de éxito se emiten después de que la operación correspondiente termina correctamente;
los de fallo no indican éxito. El formulario también emite eventos de visualización y avance.

| Evento | Momento | Propiedades explícitas |
| --- | --- | --- |
| `logged_in` | La petición de inicio de sesión se completa. | `role` |
| `login_failed` | Falla la petición de inicio de sesión. | `status` |
| `logout_succeeded` | La petición de cierre de sesión se completa. | `role` |
| `logout_failed` | Falla la petición de cierre de sesión. | `role` |
| `registered_company` | Se completa la petición de registro; no garantiza que el inicio de sesión posterior haya tenido éxito. | Ninguna |
| `viewed_wizard` | Se monta el formulario del flujo. | `flow` |
| `completed_wizard_step` | Un paso del formulario se valida y se avanza. | `flow`, `step` |
| `submitted_wizard` | Se completa la función de envío del formulario. En el flujo `guest` no implica envío a la API. | `flow` |
| `wizard_submit_failed` | Falla la función de envío del formulario. | `flow`, `status` |
| `company_project_edit_submitted` | La API confirma la solicitud de modificación; no implica que el cambio haya sido aprobado. | `role=company` |
| `company_project_edit_failed` | Falla el envío de la solicitud de modificación. | `role=company`, `status` |
| `admin_edit_review_succeeded` | La API confirma la aprobación o rechazo. | `role=admin`, `decision` |
| `admin_edit_review_failed` | Falla la aprobación o rechazo. | `role=admin`, `decision`, `status` |

## Propiedades y privacidad

- `role`: `company`, `admin`, `guest` o `unknown`. `guest` significa que no hay usuario;
  `unknown` se usa durante la recuperación de sesión o cuando falta un rol. **No todos los
  eventos incluyen `role`**: consulta la tabla antes de filtrar por empresa.
- `location`: identifica la sección de origen; no es una ruta de usuario.
- `decision`: `approve` o `reject`.
- `status`: código HTTP como texto, o `network` cuando el error no es un `ApiError`.
- `flow`: `guest`, `register` o `project`; `step` es el número de paso como texto.

No añadir correos, contraseñas, identificadores, títulos, descripciones ni motivos de rechazo
a las propiedades explícitas. El enmascaramiento de inputs no sustituye una revisión de la
configuración de autocaptura y grabaciones de PostHog: pueden recopilarse otros datos de página.

## Comprobación y mantenimiento

1. En un entorno de prueba autorizado, configura `VITE_POSTHOG_KEY` y el host de la región
   siguiendo [DEPLOYMENT.md](./DEPLOYMENT.md). No uses credenciales ni datos reales para las pruebas.
2. Ejecuta la aplicación, realiza la acción y busca el nombre del evento en la actividad de
   PostHog. Comprueba sus propiedades y verifica por separado los escenarios de éxito y error.
3. Sin clave, `track()` no envía eventos. Al modificar una interacción, actualiza el tipo
   `AnalyticsEvent`, su llamada y este catálogo; evita reutilizar nombres para acciones distintas.
