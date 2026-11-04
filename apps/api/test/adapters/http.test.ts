import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { Email } from "../../src/domain/value-objects/email.js";
import {
  crearCasosDeUso,
  crearDependencias,
  type Dependencias,
} from "../../src/infrastructure/container.js";
import type { Config } from "../../src/infrastructure/config/env.js";
import { crearApp } from "../../src/infrastructure/http/app.js";

// Levanta la app real con los adaptadores en memoria y le pega por HTTP.
describe("API HTTP", () => {
  let server: Server;
  let origen: string;
  let base: string;
  let dependencias: Dependencias;
  const config = {
    puerto: 0,
    persistencia: "memoria",
    supabase: null,
    cookies: { secure: true, sameSite: "lax" },
  } as const satisfies Config;

  before(async () => {
    dependencias = crearDependencias(config);
    server = crearApp(crearCasosDeUso(dependencias), config).listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    origen = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    base = `${origen}/api`;
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

  it("no habilita CORS: la web llega por el proxy de Vite o Vercel, en el mismo origen", async () => {
    const otroOrigen = { Origin: "http://localhost:5173" };
    const preflight = await fetch(`${base}/auth/login`, {
      method: "OPTIONS",
      headers: {
        ...otroOrigen,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    const simple = await fetch(`${base}/`, { headers: otroOrigen });
    for (const res of [preflight, simple]) {
      assert.equal(res.headers.get("access-control-allow-origin"), null);
      assert.equal(res.headers.get("access-control-allow-credentials"), null);
    }
  });

  it("solo expone las rutas bajo /api, que es lo que el proxy de Vercel reenvía", async () => {
    const credenciales = JSON.stringify({ email: "a@ejemplo.com", password: "clave-segura" });
    for (const ruta of ["/auth/login", "/companies/register"]) {
      const res = await fetch(`${origen}${ruta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: credenciales,
      });
      assert.equal(res.status, 404, ruta);
    }
    assert.equal((await fetch(`${origen}/`)).status, 404);
  });

  it("GET /api responde el health check", async () => {
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
      businessSector: "IT",
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
        businessSector: "IT",
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
          businessSector: "IT",
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
      assert.match(access, /^access_token=[^;]+; Max-Age=3600; Path=\/api; /);
      assert.match(refresh, /^refresh_token=[^;]+; Max-Age=\d+; Path=\/api\/auth; /);
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

  describe("POST /projects", () => {
    const clave = "clave-segura";
    const proyecto = {
      title: "Marketplace",
      description: "A platform to connect buyers and sellers",
      vertical: "E-commerce",
      businessSectors: ["Product", "IT"],
      projectStage: "MVP",
    };
    let cookie: string;
    let companyId: string;

    /** Logs in and returns the access_token cookie, as the browser would send it back. */
    const iniciarSesion = async (email: string) => {
      const res = await post("/auth/login", JSON.stringify({ email, password: clave }));
      const [access = ""] = res.headers.getSetCookie();
      return access.split(";")[0] ?? "";
    };

    const subir = (body: unknown, cookies?: string) =>
      fetch(`${base}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cookies ? { Cookie: cookies } : {}) },
        body: JSON.stringify(body),
      });

    before(async () => {
      const email = "proyectos@ejemplo.com";
      const res = await post(
        "/companies/register",
        JSON.stringify({
          email,
          password: clave,
          firstName: "Ana",
          lastName: "García",
          jobPosition: "CTO",
          companyName: "Acme",
          country: "Argentina",
          businessSector: "IT",
          organizationType: "Educational Institute",
        }),
      );
      companyId = ((await res.json()) as { id: string }).id;
      cookie = await iniciarSesion(email);
    });

    it("crea el proyecto a nombre de la company de la sesión", async () => {
      const res = await subir(proyecto, cookie);

      assert.equal(res.status, 201);
      const creado = (await res.json()) as { id: string };
      assert.ok(creado.id);
      assert.deepEqual(creado, { id: creado.id, companyId, ...proyecto, status: "pending" });
    });

    it("ignora un companyId enviado en el body", async () => {
      const res = await subir({ ...proyecto, companyId: "otra-company" }, cookie);

      assert.equal(res.status, 201);
      assert.equal(((await res.json()) as { companyId: string }).companyId, companyId);
    });

    it("responde 401 sin la cookie de sesión", async () => {
      const res = await subir(proyecto);
      assert.equal(res.status, 401);
      assert.deepEqual(await res.json(), { error: "Authentication required" });
    });

    it("responde 401 ante un token inválido o una cookie que no es texto", async () => {
      for (const invalida of ["access_token=inventado", "access_token=j:{}"]) {
        const res = await subir(proyecto, invalida);
        assert.equal(res.status, 401, invalida);
        assert.deepEqual(await res.json(), { error: "Authentication required" });
      }
    });

    it("responde 403 si el usuario no tiene el rol company", async () => {
      const email = "sin-rol@ejemplo.com";
      await dependencias.auth.register(Email.create(email), clave);

      const res = await subir(proyecto, await iniciarSesion(email));

      assert.equal(res.status, 403);
      assert.deepEqual(await res.json(), { error: "Only companies can upload projects" });
    });

    it("responde 403 si el usuario tiene el rol pero no su company", async () => {
      const email = "sin-company@ejemplo.com";
      await dependencias.auth.register(Email.create(email), clave, "company");

      const res = await subir(proyecto, await iniciarSesion(email));

      assert.equal(res.status, 403);
    });

    it("responde 400 ante valores inválidos", async () => {
      const cases = [
        { override: { vertical: "Magic" }, error: "Invalid vertical: Magic" },
        { override: { projectStage: "Beta" }, error: "Invalid project stage: Beta" },
        { override: { businessSectors: ["Magic"] }, error: "Invalid business sector: Magic" },
        { override: { businessSectors: [] }, error: "At least one business sector is required" },
      ];

      for (const { override, error } of cases) {
        const res = await subir({ ...proyecto, ...override }, cookie);
        assert.equal(res.status, 400, JSON.stringify(override));
        assert.deepEqual(await res.json(), { error });
      }
    });

    it("responde 400 si faltan campos o businessSectors no es una lista de textos", async () => {
      const { title: _title, ...sinTitulo } = proyecto;
      for (const body of [
        sinTitulo,
        { ...proyecto, businessSectors: "IT" },
        { ...proyecto, businessSectors: [1] },
      ]) {
        assert.equal((await subir(body, cookie)).status, 400, JSON.stringify(body));
      }
    });
  });
});
