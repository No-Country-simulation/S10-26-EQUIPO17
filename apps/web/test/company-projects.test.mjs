import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";

const project = {
  id: "project-1",
  companyId: "company-1",
  title: "Plataforma educativa",
  description: "Gestión de tareas",
  vertical: "E-commerce",
  businessSectors: ["Product", "IT"],
  projectStage: "MVP",
};

let server;
let listProjects;
let ProjectCard;
let ProjectsList;
let NewProjectForm;
let RegisterCompanyForm;
let AuthContext;
const originalFetch = globalThis.fetch;

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  ({ listProjects } = await server.ssrLoadModule("/src/features/dashboard-company/projectService.ts"));
  ({ ProjectCard } = await server.ssrLoadModule("/src/features/dashboard-company/components/ProjectCard.tsx"));
  ({ ProjectsList } = await server.ssrLoadModule("/src/features/dashboard-company/components/ProjectsList.tsx"));
  ({ NewProjectForm } = await server.ssrLoadModule("/src/features/project-submission/views/NewProjectForm.tsx"));
  ({ RegisterCompanyForm } = await server.ssrLoadModule("/src/features/project-submission/views/RegisterCompanyForm.tsx"));
  ({ AuthContext } = await server.ssrLoadModule("/src/features/auth/AuthContext.ts"));
});

after(async () => {
  globalThis.fetch = originalFetch;
  await server?.close();
});

test("solicita proyectos sin body y devuelve la lista de la API", async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return Response.json([project]);
  };
  assert.deepEqual(await listProjects(), [project]);
  assert.equal(request.url, "/api/projects");
  assert.equal(request.options.method, "GET");
  assert.equal(request.options.body, undefined);
  assert.notEqual(request.options.credentials, "omit");
});

test("distingue una lista vacía de respuestas inválidas y errores", async () => {
  globalThis.fetch = async () => Response.json([]);
  assert.deepEqual(await listProjects(), []);

  globalThis.fetch = async () => Response.json([{ ...project, businessSectors: null }]);
  await assert.rejects(listProjects());

  globalThis.fetch = async () => Response.json({ error: "No autenticado" }, { status: 401 });
  await assert.rejects(listProjects(), { status: 401 });
});

test("muestra el detalle con iconos del formulario y oculta los identificadores", () => {
  const html = renderToStaticMarkup(React.createElement(ProjectCard, { project, newlyPublished: true }));
  for (const text of ["Plataforma educativa", "Gestión de tareas", "E-commerce", "Producto", "IT &amp; Cloud Ops", "Proyecto publicado", "Pending", "status-warning", "motion-safe:animate-pulse", "hover-3d", "aura-holo", "shopping_cart", "inventory_2", "cloud", "modal-box"]) {
    assert.ok(html.includes(text), `Falta ${text}`);
  }
  assert.doesNotMatch(html, /project-1|company-1/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /aria-labelledby=/);
  assert.match(html, /popover="auto"/);
  assert.match(html, /popovertargetaction="hide"/i);
  const card = html.slice(0, html.indexOf("</article>"));
  assert.match(card, /Etapa actual del proyecto/);
  assert.match(card, /MVP/);
  assert.match(card, /build/);
  assert.doesNotMatch(card, /Vertical de la solución|Sectores involucrados|Producto|IT &amp; Cloud Ops|E-commerce/);
  const modal = html.slice(html.indexOf("</article>"));
  for (const text of ["Etapa actual del proyecto", "MVP", "Vertical de la solución", "E-commerce", "Sectores involucrados", "Producto", "IT &amp; Cloud Ops"]) {
    assert.ok(modal.includes(text), `Falta en modal: ${text}`);
  }
  assert.match(html, /aura aura-holo/);
  assert.match(html, /badge[^"]*rounded-xl/);
  assert.doesNotMatch(html, /aura-rainbow/);
  const unknown = renderToStaticMarkup(React.createElement(ProjectCard, { project: { ...project, businessSectors: ["Nuevo sector"] } }));
  assert.ok(unknown.includes("Nuevo sector"));
  const scaling = renderToStaticMarkup(React.createElement(ProjectCard, { project: { ...project, projectStage: "Scaling" } }));
  assert.match(scaling.slice(0, scaling.indexOf("</article>")), /Escalando/);
  const other = renderToStaticMarkup(React.createElement(ProjectCard, { project }));
  assert.ok(!other.includes("Proyecto publicado"));
});

test("muestra carga, error, vacío o todas las tarjetas según la respuesta", () => {
  const render = (result) => renderToStaticMarkup(React.createElement(ProjectsList, { result, onRetry: () => {} }));
  const loading = render(null);
  assert.match(loading, /Cargando tus proyectos/);
  assert.doesNotMatch(loading, /Aún no hay proyectos/);
  const error = render({ projects: null, error: "No se pudieron cargar" });
  assert.match(error, /No se pudieron cargar/);
  assert.match(error, /Reintentar/);
  assert.doesNotMatch(error, /Aún no hay proyectos/);
  const empty = render({ projects: [], error: null });
  assert.match(empty, /Aún no hay proyectos para mostrar/);
  const populated = render({ projects: [project, { ...project, id: "project-2", title: "Segundo proyecto" }], error: null });
  assert.match(populated, /Plataforma educativa/);
  assert.match(populated, /Segundo proyecto/);
  assert.doesNotMatch(populated, /Aún no hay proyectos/);
});

test("habilita Atrás en el formulario de proyecto y lo mantiene deshabilitado al iniciar el registro", () => {
  const render = (Component) => renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      { value: { user: null, loading: false, signIn: async () => {}, signOut: async () => {} } },
      React.createElement(MemoryRouter, null, React.createElement(Component)),
    ),
  );
  const button = /<button\b[^>]*>[^<]*<span[^>]*>arrow_back<\/span>Atrás<\/button>/;
  const projectBack = render(NewProjectForm).match(button)?.[0];
  const registerBack = render(RegisterCompanyForm).match(button)?.[0];
  assert.ok(projectBack);
  assert.ok(registerBack);
  assert.doesNotMatch(projectBack, /\sdisabled/);
  assert.match(registerBack, /\sdisabled/);
});
