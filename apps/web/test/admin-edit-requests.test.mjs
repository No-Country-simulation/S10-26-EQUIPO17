import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";

const request = {
  id: "request-1",
  projectId: "project-1",
  companyId: "company-1",
  requestedByUserId: "user-1",
  proposedProject: {
    id: "project-1",
    companyId: "company-1",
    title: "Plataforma fintech",
    description: "Gestión de tareas",
    vertical: "E-commerce",
    businessSectors: ["Product", "IT"],
    projectStage: "MVP",
  },
  status: "pending",
  createdAt: "2026-11-12T00:34:43.477Z",
  reviewedByUserId: null,
  reviewedAt: null,
  rejectionReason: null,
};

const originalFetch = globalThis.fetch;
let server;
let listEditRequests;
let approveEditRequest;
let rejectEditRequest;
let EditRequestCard;
let EditRequestsList;
let Dashboard;
let AuthContext;

before(async () => {
  server = await createServer({ server: { middlewareMode: true, ws: false }, appType: "custom" });
  ({ listEditRequests, approveEditRequest, rejectEditRequest } = await server.ssrLoadModule("/src/features/dashboard-admin/editRequestService.ts"));
  ({ EditRequestCard } = await server.ssrLoadModule("/src/features/dashboard-admin/components/EditRequestCard.tsx"));
  ({ EditRequestsList } = await server.ssrLoadModule("/src/features/dashboard-admin/components/EditRequestsList.tsx"));
  ({ Dashboard } = await server.ssrLoadModule("/src/features/auth/views/Dashboard.tsx"));
  ({ AuthContext } = await server.ssrLoadModule("/src/features/auth/AuthContext.ts"));
});

after(async () => {
  globalThis.fetch = originalFetch;
  await server?.close();
});

test("solicita modificaciones sin body y valida la respuesta", async () => {
  let call;
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    call = { url, options };
    return Response.json([request]);
  };
  assert.deepEqual(await listEditRequests(controller.signal), [request]);
  assert.equal(call.url, "/api/project-edit-requests");
  assert.equal(call.options.method, "GET");
  assert.equal(call.options.body, undefined);
  assert.notEqual(call.options.credentials, "omit");
  assert.equal(call.options.signal, controller.signal);

  globalThis.fetch = async () => Response.json([]);
  assert.deepEqual(await listEditRequests(), []);
  globalThis.fetch = async () => Response.json([{ ...request, proposedProject: { ...request.proposedProject, businessSectors: null } }]);
  await assert.rejects(listEditRequests());
  globalThis.fetch = async () => Response.json({ error: "No autorizado" }, { status: 403 });
  await assert.rejects(listEditRequests(), { status: 403 });
});

test("envía las decisiones con el identificador de solicitud y propaga errores", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json(request);
  };
  await approveEditRequest("request/1");
  await rejectEditRequest("request/2", "No va acorde a las tecnologías");
  assert.equal(calls[0].url, "/api/project-edit-requests/request%2F1/approve");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.body, undefined);
  assert.equal(calls[1].url, "/api/project-edit-requests/request%2F2/reject");
  assert.equal(calls[1].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[1].options.body), { reason: "No va acorde a las tecnologías" });
  assert.notEqual(calls[1].options.credentials, "omit");
  globalThis.fetch = async () => Response.json({ error: "Ya fue revisada" }, { status: 409 });
  await assert.rejects(approveEditRequest("request-1"), { status: 409 });
  await assert.rejects(rejectEditRequest("request-1", "Motivo"), { status: 409 });
});

test("agrupa los identificadores únicos y muestra los metadatos de forma compacta", () => {
  const html = renderToStaticMarkup(React.createElement(EditRequestCard, { request }));
  for (const text of [
    "Identificador de Solicitud", "request-1", "Identificador del proyecto", "project-1",
    "Identificador de la empresa", "company-1", "Solicitado por", "user-1", "Estado",
    "Pendiente (pending)", "status-warning", "12 nov 2026, 00:34 UTC",
    "Detalles técnicos e IDs", "Plataforma fintech", "Gestión de tareas",
    "E-commerce", "Producto (Product)", "IT &amp; Cloud Ops (IT)", "MVP", "inventory_2", "cloud",
  ]) assert.ok(html.includes(text), `Falta ${text}`);
  for (const text of ["Revisado por", "Fecha de revisión", "Motivo de rechazo", "Sin revisar", "Sin motivo de rechazo"]) {
    assert.ok(!html.includes(text), `No debería mostrarse ${text}`);
  }
  assert.equal((html.match(/<details class="collapse /g) ?? []).length, 1);
  assert.equal((html.match(/aria-label="Copiar /g) ?? []).length, 4);
  assert.equal((html.match(/class="swap swap-rotate /g) ?? []).length, 4);
  assert.match(html, /grid-cols-1 gap-4 md:grid-cols-2/);
  assert.match(html, /grid-cols-2 gap-4 sm:grid-cols-3/);
  assert.doesNotMatch(html, />Título<\/dt>/);
  assert.equal((html.match(/Plataforma fintech/g) ?? []).length, 1);

  const differentIds = renderToStaticMarkup(React.createElement(EditRequestCard, {
    request: { ...request, proposedProject: { ...request.proposedProject, id: "otro-proyecto", companyId: "otra-empresa" } },
  }));
  assert.match(differentIds, /otro-proyecto/);
  assert.match(differentIds, /otra-empresa/);
  assert.equal((differentIds.match(/aria-label="Copiar /g) ?? []).length, 6);

  const invalidDate = renderToStaticMarkup(React.createElement(EditRequestCard, {
    request: { ...request, createdAt: "fecha inválida" },
  }));
  assert.match(invalidDate, /Fecha inválida: fecha inválida/);

  const reviewed = renderToStaticMarkup(React.createElement(EditRequestCard, {
    request: { ...request, status: "rejected", reviewedByUserId: "admin-1", reviewedAt: "2026-11-12", rejectionReason: "Faltan datos" },
  }));
  for (const text of ["rejected", "admin-1", "12 nov 2026, 00:00 UTC", "Faltan datos"]) assert.ok(reviewed.includes(text));
  assert.doesNotMatch(reviewed, /Pendiente \(pending\)/);
  const reviewedCard = reviewed.slice(0, reviewed.indexOf("</article>"));
  const pendingCard = html.slice(0, html.indexOf("</article>"));
  assert.doesNotMatch(reviewedCard, />Aceptar<\/button>|>Rechazar<\/button>/);
  assert.match(pendingCard, />Aceptar<\/button>/);
  assert.match(pendingCard, />Rechazar<\/button>/);
});

test("distingue carga, error, vacío y lista de solicitudes", () => {
  const render = (result) => renderToStaticMarkup(React.createElement(EditRequestsList, { result, onRetry: () => {} }));
  assert.match(render(null), /Cargando solicitudes/);
  const error = render({ requests: null, error: "Error de prueba" });
  assert.match(error, /Error de prueba/);
  assert.match(error, /Reintentar/);
  assert.doesNotMatch(error, /No hay solicitudes/);
  assert.match(render({ requests: [], error: null }), /No hay solicitudes de modificación/);
  const populated = render({ requests: [request, { ...request, id: "request-2" }], error: null });
  assert.match(populated, /request-1/);
  assert.match(populated, /request-2/);
});

test("selecciona el panel según el rol sin afectar la vista de empresa", () => {
  const render = (role) => renderToStaticMarkup(React.createElement(
    AuthContext.Provider,
    { value: { user: { id: "user-1", email: "test@example.invalid", role }, loading: false, signIn: async () => {}, signOut: async () => {} } },
    React.createElement(MemoryRouter, null, React.createElement(Dashboard)),
  ));
  const admin = render("admin");
  assert.match(admin, /Cargando solicitudes de modificación/);
  assert.doesNotMatch(admin, /Cargando tus proyectos|Subir un proyecto/);
  const company = render("company");
  assert.match(company, /Cargando tus proyectos/);
  assert.match(company, /Subir un proyecto/);
  assert.doesNotMatch(company, /Cargando solicitudes/);
});
