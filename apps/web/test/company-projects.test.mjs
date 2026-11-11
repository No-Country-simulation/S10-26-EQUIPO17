import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
const originalFetch = globalThis.fetch;

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  ({ listProjects } = await server.ssrLoadModule("/src/features/dashboard-company/projectService.ts"));
  ({ ProjectCard } = await server.ssrLoadModule("/src/features/dashboard-company/components/ProjectCard.tsx"));
  ({ ProjectsList } = await server.ssrLoadModule("/src/features/dashboard-company/components/ProjectsList.tsx"));
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

test("muestra los datos y la etiqueta del proyecto recién publicado", () => {
  const html = renderToStaticMarkup(React.createElement(ProjectCard, { project, newlyPublished: true }));
  for (const text of ["Plataforma educativa", "Gestión de tareas", "E-commerce", "Producto", "IT &amp; Cloud Ops", "MVP", "project-1", "Proyecto publicado"]) {
    assert.ok(html.includes(text), `Falta ${text}`);
  }
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
