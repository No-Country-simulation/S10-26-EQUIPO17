import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";

let server;
let AuthContext;
let RolesSection;
let CtaBanner;
let Navbar;
let HeroSection;

before(async () => {
  server = await createServer({ server: { middlewareMode: true, ws: false }, appType: "custom" });
  ({ AuthContext } = await server.ssrLoadModule("/src/features/auth/AuthContext.ts"));
  ({ RolesSection } = await server.ssrLoadModule("/src/features/dashboard-public/components/RolesSection.tsx"));
  ({ CtaBanner } = await server.ssrLoadModule("/src/features/dashboard-public/components/CtaBanner.tsx"));
  ({ Navbar } = await server.ssrLoadModule("/src/shared/components/Navbar.tsx"));
  ({ HeroSection } = await server.ssrLoadModule("/src/features/dashboard-public/components/HeroSection.tsx"));
});

test("los enlaces de navegación llevan a las páginas oficiales indicadas", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      { value: { user: null, loading: false, signIn: async () => {}, signOut: async () => {} } },
      React.createElement(MemoryRouter, null, React.createElement(Navbar)),
    ),
  );
  for (const [label, url] of [
    ["Para centros de estudio", "https://www.nocountry.tech/simulacion-laboral/como-funciona"],
    ["Para Empresas", "https://www.nocountry.tech/para-empresas/contratar"],
    ["Métricas públicas en vivo", "https://www.nocountry.tech/"],
    ["Cómo funciona", "https://www.nocountry.tech/simulacion-laboral/paradigma"],
  ]) {
    const link = markup.match(new RegExp(`<a\\b[^>]*>${label}</a>`));
    assert.ok(link, `No se encontró el enlace "${label}"`);
    assert.ok(link[0].includes(`href="${url}"`));
    assert.doesNotMatch(link[0], /\btarget=/);
  }
  assert.match(markup, /href="#talento"[^>]*>Para profesionales emergentes<\/a>/);
});

after(async () => {
  await server?.close();
});

test("los dos botones de talento enlazan al inicio de sesión oficial en la misma pestaña", () => {
  const render = (component) => renderToStaticMarkup(
    React.createElement(
      AuthContext.Provider,
      { value: { user: null, loading: false, signIn: async () => {}, signOut: async () => {} } },
      React.createElement(MemoryRouter, null, React.createElement(component)),
    ),
  );
  for (const [component, label] of [
    [RolesSection, "Postular a la próxima generación"],
    [CtaBanner, "Participar como profesional emergente"],
  ]) {
    const markup = render(component);
    const link = markup.match(new RegExp(`<a\\b[^>]*>[^<]*(?:<span[^>]*>[^<]*</span>)?\\s*${label}[^<]*</a>`));
    assert.ok(link, `No se encontró el enlace "${label}"`);
    assert.match(link[0], /href="https:\/\/talent\.nocountry\.tech\/login"/);
    assert.doesNotMatch(link[0], /\btarget=/);
  }
});

test("los botones de dashboard e instituciones enlazan a sus destinos", () => {
  for (const [component, label, url] of [
    [HeroSection, "Ver Public Dashboard en Vivo", "https://companies.nocountry.tech/simulation"],
    [RolesSection, "Agendar Demo Institucional", "https://wa.me/5491173591034"],
    [CtaBanner, "Soy Institución", "https://www.nocountry.tech/para-instituciones"],
  ]) {
    const markup = renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: { user: null, loading: false, signIn: async () => {}, signOut: async () => {} } },
        React.createElement(MemoryRouter, null, React.createElement(component)),
      ),
    );
    const link = markup.match(new RegExp(`<a\\b[^>]*>[^<]*(?:<span[^>]*>[^<]*</span>)?\\s*${label}[^<]*</a>`));
    assert.ok(link, `No se encontró el enlace "${label}"`);
    assert.ok(link[0].includes(`href="${url}"`));
    assert.doesNotMatch(link[0], /\btarget=/);
  }
});
