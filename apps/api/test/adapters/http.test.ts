import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { crearCasosDeUso, crearDependencias } from "../../src/infrastructure/container.js";
import type { Config } from "../../src/infrastructure/config/env.js";
import { crearApp } from "../../src/infrastructure/http/app.js";

// Levanta la app real con los adaptadores en memoria y le pega por HTTP.
describe("API HTTP", () => {
  let server: Server;
  let base: string;
  const web = "https://web.ejemplo.com";
  const config = {
    puerto: 0,
    persistencia: "memoria",
    supabase: null,
    cookies: { secure: true, sameSite: "lax" },
    corsOrigins: [web],
  } as const satisfies Config;

  before(async () => {
    const casos = crearCasosDeUso(crearDependencias({ ...config, corsOrigins: [web] }));
    server = crearApp(casos, { ...config, corsOrigins: [web] }).listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => {
    server.close();
  });

  const post = (ruta: string, body: string) =>
    fetch(`${base}${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

  describe("CORS", () => {
    const preflight = (origin: string) =>
      fetch(`${base}/auth/login`, {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type",
        },
      });

    it("autoriza con credenciales al origen permitido", async () => {
      const res = await fetch(`${base}/`, { headers: { Origin: web } });
      assert.equal(res.headers.get("access-control-allow-origin"), web);
      assert.equal(res.headers.get("access-control-allow-credentials"), "true");
      assert.match(res.headers.get("vary") ?? "", /Origin/);
    });

    it("responde el preflight del origen permitido", async () => {
      const res = await preflight(web);
      assert.equal(res.status, 204);
      assert.equal(res.headers.get("access-control-allow-origin"), web);
      assert.equal(res.headers.get("access-control-allow-credentials"), "true");
      assert.match(res.headers.get("access-control-allow-methods") ?? "", /POST/);
      assert.match(res.headers.get("access-control-allow-headers") ?? "", /content-type/i);
    });

    it("no autoriza orígenes parecidos, null ni requests sin Origin", async () => {
      for (const origin of [
        "https://evil-web.ejemplo.com",
        "https://web.ejemplo.com.evil.com",
        "http://web.ejemplo.com",
        "null",
      ]) {
        for (const res of [await fetch(`${base}/`, { headers: { Origin: origin } }), await preflight(origin)]) {
          assert.equal(res.headers.get("access-control-allow-origin"), null, origin);
          assert.equal(res.headers.get("access-control-allow-credentials"), null, origin);
        }
      }
      assert.equal((await fetch(`${base}/`)).headers.get("access-control-allow-origin"), null);
    });

    it("marca toda respuesta con Vary: Origin para que ningún cache la reuse entre orígenes", async () => {
      const casos: Record<string, string>[] = [
        {},
        { Origin: "https://evil-web.ejemplo.com" },
        { Origin: web },
      ];
      for (const headers of casos) {
        const res = await fetch(`${base}/`, { headers });
        assert.match(res.headers.get("vary") ?? "", /Origin/, JSON.stringify(headers));
      }
    });

    it("incluye los headers CORS en los errores para el origen permitido", async () => {
      const malFormado = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { Origin: web, "Content-Type": "application/json" },
        body: "{ no es json",
      });
      const inexistente = await fetch(`${base}/no-existe`, { headers: { Origin: web } });
      for (const res of [malFormado, inexistente]) {
        assert.equal(res.headers.get("access-control-allow-origin"), web);
        assert.equal(res.headers.get("access-control-allow-credentials"), "true");
      }
      assert.equal(malFormado.status, 400);
      assert.equal(inexistente.status, 404);
    });
  });

  it("GET / responde el health check", async () => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "ok" });
  });

  it("ya no expone POST /users, POST /companies ni GET /companies/:id", async () => {
    const company = JSON.stringify({ companyName: "Acme" });
    assert.equal((await post("/users", company)).status, 404);
    assert.equal((await post("/companies", company)).status, 404);
    assert.equal((await fetch(`${base}/companies/cualquier-id`)).status, 404);
  });

  describe("POST /companies/register", () => {
    const registro = {
      email: "registro@ejemplo.com",
      password: "clave-segura",
      firstName: "Ana",
      lastName: "García",
      jobPosition: "CTO",
      companyName: "Acme",
      country: "Argentina",
      businessSector: "Technology",
      organizationType: "Educational Institute",
    };

    it("crea el usuario y la company en una sola request", async () => {
      const res = await post("/companies/register", JSON.stringify(registro));
      assert.equal(res.status, 201);
      const company = (await res.json()) as { id: string; user: { id: string } };

      assert.deepEqual(company, {
        id: company.id,
        firstName: "Ana",
        lastName: "García",
        jobPosition: "CTO",
        companyName: "Acme",
        country: "Argentina",
        businessSector: "Technology",
        organizationType: "Educational Institute",
        user: { id: company.user.id, email: "registro@ejemplo.com" },
      });
    });

    it("responde 400 ante datos de company inválidos sin dejar el email tomado", async () => {
      const datos = { ...registro, email: "invalido@ejemplo.com" };
      const res = await post("/companies/register", JSON.stringify({ ...datos, country: "Narnia" }));
      assert.equal(res.status, 400);
      assert.deepEqual(await res.json(), { error: "Invalid country: Narnia" });

      assert.equal((await post("/companies/register", JSON.stringify(datos))).status, 201);
    });

    it("responde 400 ante un country, businessSector u organizationType inválido", async () => {
      const cases = [
        { override: { country: "Narnia" }, error: "Invalid country: Narnia" },
        { override: { businessSector: "Magic" }, error: "Invalid business sector: Magic" },
        {
          override: { organizationType: "Government" },
          error: "Invalid organization type: Government",
        },
      ];

      for (const { override, error } of cases) {
        const res = await post("/companies/register", JSON.stringify({ ...registro, ...override }));
        assert.equal(res.status, 400, JSON.stringify(override));
        assert.deepEqual(await res.json(), { error });
      }
    });

    it("responde 400 si organizationType no es un texto o faltan campos", async () => {
      const sinTexto = { ...registro, organizationType: ["StartUp"] };
      assert.equal((await post("/companies/register", JSON.stringify(sinTexto))).status, 400);
      const soloNombre = JSON.stringify({ companyName: "Acme" });
      assert.equal((await post("/companies/register", soloNombre)).status, 400);
    });

    it("responde 400 ante JSON mal formado", async () => {
      assert.equal((await post("/companies/register", "{ no es json")).status, 400);
    });

    it("responde 409 si el email ya está registrado", async () => {
      const datos = { ...registro, email: "repetido@ejemplo.com" };
      assert.equal((await post("/companies/register", JSON.stringify(datos))).status, 201);
      assert.equal((await post("/companies/register", JSON.stringify(datos))).status, 409);
    });

    it("responde 400 si falta el email o la contraseña", async () => {
      const { password: _password, ...sinClave } = registro;
      assert.equal((await post("/companies/register", JSON.stringify(sinClave))).status, 400);
    });
  });

  describe("POST /auth/login", () => {
    const credenciales = { email: "login@ejemplo.com", password: "clave-segura" };
    let userId: string;

    before(async () => {
      const res = await post(
        "/companies/register",
        JSON.stringify({
          ...credenciales,
          firstName: "Ana",
          lastName: "García",
          jobPosition: "CTO",
          companyName: "Acme",
          country: "Argentina",
          businessSector: "Technology",
          organizationType: "Educational Institute",
        }),
      );
      userId = ((await res.json()) as { user: { id: string } }).user.id;
    });

    it("devuelve el usuario con su rol y la sesión en cookies HttpOnly", async () => {
      const res = await post("/auth/login", JSON.stringify(credenciales));

      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), {
        user: { id: userId, email: "login@ejemplo.com", role: "company" },
      });

      const [access = "", refresh = ""] = res.headers.getSetCookie();
      assert.match(access, /^access_token=[^;]+; Max-Age=3600; Path=\/; /);
      assert.match(refresh, /^refresh_token=[^;]+; Max-Age=\d+; Path=\/auth; /);
      for (const cookie of [access, refresh]) {
        assert.match(cookie, /; HttpOnly/);
        assert.match(cookie, /; Secure/);
        assert.match(cookie, /; SameSite=Lax/);
      }
    });

    it("responde 401 sin cookies ante una contraseña incorrecta o un email desconocido", async () => {
      for (const body of [
        { ...credenciales, password: "otra-clave" },
        { ...credenciales, email: "nadie@ejemplo.com" },
      ]) {
        const res = await post("/auth/login", JSON.stringify(body));
        assert.equal(res.status, 401);
        assert.deepEqual(await res.json(), { error: "Invalid email or password" });
        assert.deepEqual(res.headers.getSetCookie(), []);
      }
    });

    it("responde 400 si falta la contraseña", async () => {
      const res = await post("/auth/login", JSON.stringify({ email: credenciales.email }));
      assert.equal(res.status, 400);
    });
  });
});
