import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";

const user = { id: "user-1", email: "empresa@example.invalid", role: "company" };
const originalFetch = globalThis.fetch;
let server;
let getSession;
let AuthContext;
let Navbar;

before(async () => {
  server = await createServer({ server: { middlewareMode: true, ws: false }, appType: "custom" });
  ({ getSession } = await server.ssrLoadModule("/src/features/auth/authService.ts"));
  ({ AuthContext } = await server.ssrLoadModule("/src/features/auth/AuthContext.ts"));
  ({ Navbar } = await server.ssrLoadModule("/src/shared/components/Navbar.tsx"));
});

after(async () => {
  globalThis.fetch = originalFetch;
  await server?.close();
});

test("recupera la sesión con auth/me sin renovar los tokens", async () => {
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push([url, init.method ?? "GET"]);
    return Response.json({ user });
  };
  assert.deepEqual(await getSession(), user);
  assert.deepEqual(requests, [["/api/auth/me", "GET"]]);
});

test("renueva solo cuando auth/me responde 401", async () => {
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push([url, init.method ?? "GET"]);
    return url.endsWith("/me")
      ? Response.json({ error: "No autenticado" }, { status: 401 })
      : Response.json({ user });
  };
  assert.deepEqual(await getSession(), user);
  assert.deepEqual(requests, [["/api/auth/me", "GET"], ["/api/auth/refresh", "POST"]]);

  globalThis.fetch = async () => Response.json({ error: "No autenticado" }, { status: 401 });
  assert.equal(await getSession(), null);

  globalThis.fetch = async () => Response.json({ error: "Error" }, { status: 503 });
  await assert.rejects(getSession(), { status: 503 });
});

test("muestra la identidad solo con sesión y conserva cerrar sesión", () => {
  const render = (sessionUser, loading = false) => renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      { value: { user: sessionUser, loading, signIn: async () => user, signOut: async () => {} } },
      React.createElement(MemoryRouter, null, React.createElement(Navbar)),
    ),
  );
  const company = render(user);
  assert.match(company, /person/);
  assert.match(company, /Bienvenido · Empresa/);
  assert.match(company, /empresa@example\.invalid/);
  assert.match(company, /Cerrar sesión/);
  assert.doesNotMatch(company, /Iniciar sesión/);
  assert.match(company, /href="\/dashboard"[^>]*>Mis proyectos<\/a>/);
  const admin = render({ ...user, role: "admin" });
  assert.match(admin, /Bienvenido · Administrador/);
  assert.match(admin, /Panel de administrador/);
  assert.doesNotMatch(admin, /Mis proyectos/);
  const noRole = render({ ...user, role: null });
  assert.match(noRole, /Bienvenido · Sin rol/);
  assert.doesNotMatch(noRole, /Mis proyectos|Panel de administrador/);
  const guest = render(null);
  assert.doesNotMatch(guest, /Sesión actual/);
  assert.match(guest, /Para centros de estudio/);
  assert.match(guest, /Métricas públicas en vivo/);
  for (const html of [company, admin, noRole, render(user, true)]) {
    assert.doesNotMatch(html, /Para centros de estudio|Para Empresas|Para profesionales emergentes|Cómo funciona|Métricas públicas en vivo/);
  }
  assert.doesNotMatch(render(user, true), /Sesión actual/);
});
