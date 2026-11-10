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
import { BusinessSector } from "../../src/domain/value-objects/business-sector.js";
import { OrganizationType } from "../../src/domain/value-objects/organization-type.js";
import { resolve } from "node:path";

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

  /** Value of a cookie in a response's Set-Cookie headers. */
  const valorDeCookie = (res: Response, nombre: string) =>
    res.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith(`${nombre}=`))
      ?.split(";")[0]
      ?.slice(nombre.length + 1) ?? "";

  const assertCookiesBorradas = (res: Response) => {
    const [access = "", refresh = ""] = res.headers.getSetCookie();
    assert.match(
      access,
      /^access_token=; Path=\/api; Expires=Thu, 01 Jan 1970/,
    );
    assert.match(
      refresh,
      /^refresh_token=; Path=\/api\/auth; Expires=Thu, 01 Jan 1970/,
    );
    for (const cookie of [access, refresh]) {
      assert.match(cookie, /; HttpOnly/);
      assert.match(cookie, /; Secure/);
      assert.match(cookie, /; SameSite=Lax/);
    }
  };

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
    const credenciales = JSON.stringify({
      email: "a@ejemplo.com",
      password: "clave-segura",
    });
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
      const company = (await res.json()) as {
        id: string;
        user: { id: string };
      };

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
      const res = await post(
        "/companies/register",
        JSON.stringify({ ...datos, country: "Narnia" }),
      );
      assert.equal(res.status, 400);
      assert.deepEqual(await res.json(), { error: "Invalid country: Narnia" });

      assert.equal(
        (await post("/companies/register", JSON.stringify(datos))).status,
        201,
      );
    });

    it("responde 400 ante un country, businessSector u organizationType inválido", async () => {
      const cases = [
        { override: { country: "Narnia" }, error: "Invalid country: Narnia" },
        {
          override: { businessSector: "Magic" },
          error: "Invalid business sector: Magic",
        },
        {
          override: { organizationType: "Government" },
          error: "Invalid organization type: Government",
        },
      ];

      for (const { override, error } of cases) {
        const res = await post(
          "/companies/register",
          JSON.stringify({ ...registro, ...override }),
        );
        assert.equal(res.status, 400, JSON.stringify(override));
        assert.deepEqual(await res.json(), { error });
      }
    });

    it("responde 400 si organizationType no es un texto o faltan campos", async () => {
      const sinTexto = { ...registro, organizationType: ["StartUp"] };
      assert.equal(
        (await post("/companies/register", JSON.stringify(sinTexto))).status,
        400,
      );
      const soloNombre = JSON.stringify({ companyName: "Acme" });
      assert.equal((await post("/companies/register", soloNombre)).status, 400);
    });

    it("responde 400 ante JSON mal formado", async () => {
      assert.equal(
        (await post("/companies/register", "{ no es json")).status,
        400,
      );
    });

    it("responde 409 si el email ya está registrado", async () => {
      const datos = { ...registro, email: "repetido@ejemplo.com" };
      assert.equal(
        (await post("/companies/register", JSON.stringify(datos))).status,
        201,
      );
      assert.equal(
        (await post("/companies/register", JSON.stringify(datos))).status,
        409,
      );
    });

    it("responde 400 si falta el email o la contraseña", async () => {
      const { password: _password, ...sinClave } = registro;
      assert.equal(
        (await post("/companies/register", JSON.stringify(sinClave))).status,
        400,
      );
    });
  });

  describe("POST /auth/login", () => {
    const credenciales = {
      email: "login@ejemplo.com",
      password: "clave-segura",
    };
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
      assert.match(
        refresh,
        /^refresh_token=[^;]+; Max-Age=\d+; Path=\/api\/auth; /,
      );
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
        assert.deepEqual(await res.json(), {
          error: "Invalid email or password",
        });
        assert.deepEqual(res.headers.getSetCookie(), []);
      }
    });

    it("responde 400 si falta la contraseña", async () => {
      const res = await post(
        "/auth/login",
        JSON.stringify({ email: credenciales.email }),
      );
      assert.equal(res.status, 400);
    });
  });

  describe("POST /auth/refresh", () => {
    const credenciales = {
      email: "refresh@ejemplo.com",
      password: "clave-segura",
    };
    let userId: string;

    before(async () => {
      userId = await dependencias.auth.register(
        Email.create(credenciales.email),
        credenciales.password,
        "company",
      );
    });

    /** Logs in and returns the refresh_token, as the browser holds it. */
    const iniciarSesion = async () =>
      valorDeCookie(
        await post("/auth/login", JSON.stringify(credenciales)),
        "refresh_token",
      );

    const refrescar = (cookie?: string) =>
      fetch(`${base}/auth/refresh`, {
        method: "POST",
        headers: cookie ? { Cookie: cookie } : {},
      });

    const assertCookiesBorradas = (res: Response) => {
      const [access = "", refresh = ""] = res.headers.getSetCookie();
      assert.match(
        access,
        /^access_token=; Path=\/api; Expires=Thu, 01 Jan 1970/,
      );
      assert.match(
        refresh,
        /^refresh_token=; Path=\/api\/auth; Expires=Thu, 01 Jan 1970/,
      );
      for (const cookie of [access, refresh]) {
        assert.match(cookie, /; HttpOnly/);
        assert.match(cookie, /; Secure/);
        assert.match(cookie, /; SameSite=Lax/);
      }
    };

    it("devuelve el usuario y escribe las dos cookies nuevas, igual que el login", async () => {
      const anterior = await iniciarSesion();

      const res = await refrescar(`refresh_token=${anterior}`);

      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), {
        user: { id: userId, email: credenciales.email, role: "company" },
      });

      const [access = "", refresh = ""] = res.headers.getSetCookie();
      assert.match(access, /^access_token=[^;]+; Max-Age=3600; Path=\/api; /);
      assert.match(
        refresh,
        /^refresh_token=[^;]+; Max-Age=2592000; Path=\/api\/auth; /,
      );
      for (const cookie of [access, refresh]) {
        assert.match(cookie, /; HttpOnly/);
        assert.match(cookie, /; Secure/);
        assert.match(cookie, /; SameSite=Lax/);
      }
      assert.notEqual(valorDeCookie(res, "refresh_token"), anterior);
      assert.deepEqual(
        await dependencias.auth.verifyAccessToken(
          valorDeCookie(res, "access_token"),
        ),
        { userId, role: "company" },
      );
    });

    it("no expone los tokens en el body", async () => {
      const res = await refrescar(`refresh_token=${await iniciarSesion()}`);
      const texto = await res.text();

      assert.ok(!texto.includes(valorDeCookie(res, "access_token")));
      assert.ok(!texto.includes(valorDeCookie(res, "refresh_token")));
    });

    it("funciona sin access token y encadena con el refresh token rotado", async () => {
      const primero = await refrescar(`refresh_token=${await iniciarSesion()}`);

      const segundo = await refrescar(
        `refresh_token=${valorDeCookie(primero, "refresh_token")}`,
      );

      assert.equal(segundo.status, 200);
    });

    it("responde 401 y borra las dos cookies sin la cookie de refresh", async () => {
      const res = await refrescar();

      assert.equal(res.status, 401);
      assert.deepEqual(await res.json(), { error: "Authentication required" });
      assertCookiesBorradas(res);
    });

    it("responde 401 y borra las cookies ante un token inválido o que no es texto", async () => {
      for (const valor of [
        "desconocido",
        "",
        encodeURIComponent('j:{"a":1}'),
      ]) {
        const res = await refrescar(`refresh_token=${valor}`);

        assert.equal(res.status, 401, valor);
        assertCookiesBorradas(res);
      }
    });

    it("responde 401 y borra las cookies ante un refresh token ya usado", async () => {
      const usado = await iniciarSesion();
      await refrescar(`refresh_token=${usado}`);

      const res = await refrescar(`refresh_token=${usado}`);

      assert.equal(res.status, 401);
      assertCookiesBorradas(res);
    });

    it("responde 500 y conserva las cookies si el proveedor falla", async (t) => {
      t.mock.method(console, "error", () => {});
      t.mock.method(dependencias.auth, "refreshSession", async () => {
        throw new Error("Supabase Auth: boom");
      });

      const res = await refrescar("refresh_token=cualquiera");

      assert.equal(res.status, 500);
      assert.deepEqual(res.headers.getSetCookie(), []);
    });
  });

  describe("POST /auth/logout", () => {
    const credenciales = {
      email: "logout@ejemplo.com",
      password: "clave-segura",
    };

    before(async () => {
      await dependencias.auth.register(
        Email.create(credenciales.email),
        credenciales.password,
        "company",
      );
    });

    /** Logs in and returns both cookies, as the browser sends them to /api/auth. */
    const iniciarSesion = async () => {
      const res = await post("/auth/login", JSON.stringify(credenciales));
      return {
        accessToken: valorDeCookie(res, "access_token"),
        refreshToken: valorDeCookie(res, "refresh_token"),
      };
    };

    const salir = (cookie?: string) =>
      fetch(`${base}/auth/logout`, {
        method: "POST",
        headers: cookie ? { Cookie: cookie } : {},
      });

    it("responde 204, borra las dos cookies y revoca la sesión", async () => {
      const { accessToken, refreshToken } = await iniciarSesion();

      const res = await salir(
        `access_token=${accessToken}; refresh_token=${refreshToken}`,
      );

      assert.equal(res.status, 204);
      assert.equal(await res.text(), "");
      assertCookiesBorradas(res);
      await assert.rejects(dependencias.auth.verifyAccessToken(accessToken));
      await assert.rejects(dependencias.auth.refreshSession(refreshToken));
    });

    it("responde 204 al cerrar dos veces la misma sesión", async () => {
      const { accessToken, refreshToken } = await iniciarSesion();
      const cookies = `access_token=${accessToken}; refresh_token=${refreshToken}`;
      await salir(cookies);

      const res = await salir(cookies);

      assert.equal(res.status, 204);
      assertCookiesBorradas(res);
    });

    it("responde 204 y borra las cookies sin access token, o con uno inválido o que no es texto", async () => {
      const { refreshToken } = await iniciarSesion();
      const casos = [
        undefined,
        `refresh_token=${refreshToken}`,
        "access_token=desconocido",
        "access_token=",
        `access_token=${encodeURIComponent('j:{"a":1}')}`,
      ];

      for (const cookie of casos) {
        const res = await salir(cookie);

        assert.equal(res.status, 204, cookie);
        assertCookiesBorradas(res);
      }
    });

    it("responde 204, borra las cookies y registra el error si el proveedor falla", async (t) => {
      const outage = new Error("Supabase Auth: boom");
      const logs = t.mock.method(console, "error", () => {});
      t.mock.method(dependencias.auth, "logOut", async () => {
        throw outage;
      });

      const res = await salir(
        "access_token=cualquiera; refresh_token=cualquiera",
      );

      assert.equal(res.status, 204);
      assertCookiesBorradas(res);
      assert.equal(logs.mock.callCount(), 1);
      assert.equal(logs.mock.calls[0]?.arguments[0], outage);
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
      const res = await post(
        "/auth/login",
        JSON.stringify({ email, password: clave }),
      );
      const [access = ""] = res.headers.getSetCookie();
      return access.split(";")[0] ?? "";
    };

    const subir = (body: unknown, cookies?: string) =>
      fetch(`${base}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
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
      assert.deepEqual(creado, { id: creado.id, companyId, ...proyecto });
    });

    it("ignora un companyId enviado en el body", async () => {
      const res = await subir(
        { ...proyecto, companyId: "otra-company" },
        cookie,
      );

      assert.equal(res.status, 201);
      assert.equal(
        ((await res.json()) as { companyId: string }).companyId,
        companyId,
      );
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
        assert.deepEqual(await res.json(), {
          error: "Authentication required",
        });
      }
    });

    it("responde 403 si el usuario no tiene el rol company", async () => {
      const email = "sin-rol@ejemplo.com";
      await dependencias.auth.register(Email.create(email), clave);

      const res = await subir(proyecto, await iniciarSesion(email));

      assert.equal(res.status, 403);
      assert.deepEqual(await res.json(), {
        error: "Only companies can upload projects",
      });
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
        {
          override: { projectStage: "Beta" },
          error: "Invalid project stage: Beta",
        },
        {
          override: { businessSectors: ["Magic"] },
          error: "Invalid business sector: Magic",
        },
        {
          override: { businessSectors: [] },
          error: "At least one business sector is required",
        },
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
        assert.equal(
          (await subir(body, cookie)).status,
          400,
          JSON.stringify(body),
        );
      }
    });
  });
  describe("GET /projects", () => {
    const clave = "clave-segura";

    const proyecto = {
      title: "Marketplace",
      description: "A platform to connect buyers and sellers",
      vertical: "E-commerce",
      businessSectors: ["Product", "IT"],
      projectStage: "MVP",
    };

    const registrarCompany = async (email: string, companyName: string) => {
      const res = await post(
        "/companies/register",
        JSON.stringify({
          email,
          password: clave,
          firstName: "Ana",
          lastName: "García",
          jobPosition: "CTO",
          companyName,
          country: "Argentina",
          businessSector: "IT",
          organizationType: "Educational Institute",
        }),
      );

      assert.equal(res.status, 201);
      return (await res.json()) as { id: string };
    };

    const iniciarSesion = async (email: string): Promise<string> => {
      const res = await post(
        "/auth/login",
        JSON.stringify({ email, password: clave }),
      );

      assert.equal(res.status, 200);

      const cookie = res.headers
        .getSetCookie()
        .find((value) => value.startsWith("access_token="))
        ?.split(";")[0];

      assert.ok(cookie);
      return cookie;
    };

    const subirProyecto = async (cookie: string, title: string) => {
      const res = await fetch(`${base}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({ ...proyecto, title }),
      });

      assert.equal(res.status, 201);
      return (await res.json()) as { id: string };
    };

    const listarProyectos = (cookie?: string) =>
      fetch(`${base}/projects`, {
        headers: cookie ? { Cookie: cookie } : {},
      });

    it("responde 401 sin una sesión autenticada", async () => {
      const res = await listarProyectos();

      assert.equal(res.status, 401);
      assert.deepEqual(await res.json(), {
        error: "Authentication required",
      });
    });

    it("devuelve únicamente los proyectos de la company autenticada", async () => {
      const companyA = await registrarCompany(
        "listar-a@ejemplo.com",
        "Company A",
      );
      const companyB = await registrarCompany(
        "listar-b@ejemplo.com",
        "Company B",
      );
      const cookieA = await iniciarSesion("listar-a@ejemplo.com");
      const cookieB = await iniciarSesion("listar-b@ejemplo.com");

      const projectA = await subirProyecto(cookieA, "Project A");
      const projectB = await subirProyecto(cookieB, "Project B");

      const res = await listarProyectos(cookieA);

      assert.equal(res.status, 200);

      const resultado = (await res.json()) as Array<{
        id: string;
        companyId: string;
        title: string;
      }>;

      assert.deepEqual(
        resultado.map(({ id, companyId, title }) => ({
          id,
          companyId,
          title,
        })),
        [
          {
            id: projectA.id,
            companyId: companyA.id,
            title: "Project A",
          },
        ],
      );

      assert.ok(!resultado.some((project) => project.id === projectB.id));
    });

    it("devuelve una lista vacía cuando la company no tiene proyectos", async () => {
      await registrarCompany("listar-vacio@ejemplo.com", "Empty Company");

      const cookie = await iniciarSesion("listar-vacio@ejemplo.com");
      const res = await listarProyectos(cookie);

      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), []);
    });

    it("responde 403 cuando el usuario no tiene el rol company", async () => {
      const email = "listar-sin-rol@ejemplo.com";

      await dependencias.auth.register(Email.create(email), clave);

      const cookie = await iniciarSesion(email);
      const res = await listarProyectos(cookie);

      assert.equal(res.status, 403);
      assert.deepEqual(await res.json(), {
        error: "Only companies can list projects",
      });
    });

    it("responde 403 cuando el usuario no tiene una company asociada", async () => {
      const email = "listar-sin-company@ejemplo.com";

      await dependencias.auth.register(Email.create(email), clave, "company");

      const cookie = await iniciarSesion(email);
      const res = await listarProyectos(cookie);

      assert.equal(res.status, 403);
      assert.deepEqual(await res.json(), {
        error: "You must be a company to list a project",
      });
    });
  });
  describe("solicitudes de edición de proyectos", () => {
    const clave = "clave-segura";
    const proyectoBase = {
      title: "Marketplace",
      description: "A platform to connect buyers and sellers",
      vertical: "E-commerce",
      businessSectors: ["Product", "IT"],
      projectStage: "MVP",
    };

    let cookie: string;
    let cookieAdmin: string;

    const registrarCompany = async (email: string) => {
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

      assert.equal(res.status, 201);
    };

    const iniciarSesion = async (email: string): Promise<string> => {
      const res = await post(
        "/auth/login",
        JSON.stringify({ email, password: clave }),
      );

      assert.equal(res.status, 200);

      const access = res.headers
        .getSetCookie()
        .find((value) => value.startsWith("access_token="))
        ?.split(";")[0];

      assert.ok(access);
      return access;
    };

    const subirProyecto = async (title = proyectoBase.title) => {
      const res = await fetch(`${base}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({ ...proyectoBase, title }),
      });

      assert.equal(res.status, 201);

      const proyecto = (await res.json()) as { id: string };
      return proyecto.id;
    };

    const solicitarEdicion = (
      projectId: string,
      cambios: unknown,
      cookies?: string,
    ) =>
      fetch(`${base}/projects/${projectId}/edit-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify(cambios),
      });

    const obtenerProyecto = async (projectId: string) => {
      const res = await fetch(`${base}/projects`, {
        headers: { Cookie: cookie },
      });

      assert.equal(res.status, 200);

      const proyectos = (await res.json()) as Array<{
        id: string;
        title: string;
        description: string;
        vertical: string;
        businessSectors: string[];
        projectStage: string;
      }>;

      const proyecto = proyectos.find((item) => item.id === projectId);
      assert.ok(proyecto, `No se encontró el proyecto ${projectId}`);

      return proyecto;
    };

    const crearSolicitud = async (
      cambios: unknown,
      title = proyectoBase.title,
    ) => {
      const projectId = await subirProyecto(title);
      const res = await solicitarEdicion(projectId, cambios, cookie);

      assert.equal(res.status, 201);

      const solicitud = (await res.json()) as {
        id: string;
        projectId: string;
        status: string;
        proposedProject: { title: string };
      };

      return { projectId, solicitud };
    };
    //creating the admin directly through the in-memory authentication provider
    before(async () => {
      const email = "editar-proyectos@ejemplo.com";

      await registrarCompany(email);
      cookie = await iniciarSesion(email);

      const emailAdmin = "editar-proyectos-admin@ejemplo.com";

      await dependencias.auth.register(
        Email.create(emailAdmin),
        clave,
        "admin",
      );

      cookieAdmin = await iniciarSesion(emailAdmin);
    });
    describe("GET /project-edit-requests", () => {
      // admin receives pending requests, but not approved ones
      it("lista las solicitudes pendientes para un admin", async () => {
        const { solicitud: pendiente } = await crearSolicitud({
          title: "Marketplace pendiente",
        });

        const { solicitud: aprobada } = await crearSolicitud({
          title: "Marketplace aprobado",
        });

        const approveResponse = await fetch(
          `${base}/project-edit-requests/${aprobada.id}/approve`,
          {
            method: "POST",
            headers: { Cookie: cookieAdmin },
          },
        );

        assert.equal(approveResponse.status, 200);

        const res = await fetch(`${base}/project-edit-requests`, {
          headers: { Cookie: cookieAdmin },
        });

        assert.equal(res.status, 200);

        const requests = (await res.json()) as Array<{
          id: string;
          status: string;
        }>;

        assert.ok(
          requests.some((request) => request.id === pendiente.id),
          "The pending request should be included",
        );

        assert.ok(
          !requests.some((request) => request.id === aprobada.id),
          "The approved request should not be included",
        );

        assert.ok(
          requests.every((request) => request.status === "pending"),
          "The endpoint should only return pending requests",
        );
      });
      //company user tries to access and receives 403 Forbidden
      it("responde 403 si una empresa intenta listar las solicitudes", async () => {
        const res = await fetch(`${base}/project-edit-requests`, {
          headers: { Cookie: cookie },
        });

        assert.equal(res.status, 403);
      });
      // error 401 if user is not authenticated
      it("responde 401 si no hay una sesión autenticada", async () => {
        const res = await fetch(`${base}/project-edit-requests`);

        assert.equal(res.status, 401);
      });
    });
    describe("POST /projects/:projectId/edit-requests", () => {
      it("crea una solicitud pendiente sin modificar el proyecto original", async () => {
        const { projectId, solicitud } = await crearSolicitud({
          title: "Marketplace actualizado",
        });

        assert.equal(solicitud.projectId, projectId);
        assert.equal(solicitud.status, "pending");
        assert.equal(
          solicitud.proposedProject.title,
          "Marketplace actualizado",
        );

        const original = await obtenerProyecto(projectId);
        assert.equal(original.title, "Marketplace");
      });

      it("responde 401 si no hay una sesión autenticada", async () => {
        const projectId = await subirProyecto("Proyecto sin sesión");

        const res = await solicitarEdicion(projectId, {
          title: "Nuevo título",
        });

        assert.equal(res.status, 401);
      });

      it("responde 400 si no se propone ningún cambio", async () => {
        const projectId = await subirProyecto("Proyecto sin cambios");

        const res = await solicitarEdicion(projectId, {}, cookie);

        assert.equal(res.status, 400);
      });
    });

    describe("POST /project-edit-requests/:id/approve", () => {
      it("aprueba la solicitud y actualiza el proyecto", async () => {
        const { projectId, solicitud } = await crearSolicitud(
          { title: "Marketplace aprobado" },
          "Proyecto para aprobar",
        );

        const res = await fetch(
          `${base}/project-edit-requests/${solicitud.id}/approve`,
          {
            method: "POST",
            headers: { Cookie: cookieAdmin },
          },
        );

        assert.equal(res.status, 200);

        const revisada = (await res.json()) as {
          status: string;
          proposedProject: { title: string };
        };

        assert.equal(revisada.status, "approved");

        const proyecto = await obtenerProyecto(projectId);
        assert.equal(proyecto.title, "Marketplace aprobado");
      });

      it("responde 403 si una empresa intenta aprobar una solicitud", async () => {
        const { projectId, solicitud } = await crearSolicitud(
          { title: "Cambio no autorizado" },
          "Proyecto original",
        );

        const res = await fetch(
          `${base}/project-edit-requests/${solicitud.id}/approve`,
          {
            method: "POST",
            headers: { Cookie: cookie },
          },
        );

        assert.equal(res.status, 403);

        const proyecto = await obtenerProyecto(projectId);
        assert.equal(proyecto.title, "Proyecto original");
      });

      it("responde 401 si no hay una sesión autenticada", async () => {
        const { solicitud } = await crearSolicitud(
          { title: "Marketplace actualizado" },
          "Proyecto para aprobación sin sesión",
        );

        const res = await fetch(
          `${base}/project-edit-requests/${solicitud.id}/approve`,
          { method: "POST" },
        );

        assert.equal(res.status, 401);
      });
    });

    describe("POST /project-edit-requests/:id/reject", () => {
      it("rechaza la solicitud sin modificar el proyecto original", async () => {
        const { projectId, solicitud } = await crearSolicitud(
          { title: "Marketplace rechazado" },
          "Proyecto para rechazar",
        );

        const res = await fetch(
          `${base}/project-edit-requests/${solicitud.id}/reject`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookieAdmin,
            },
            body: JSON.stringify({
              reason: "Los cambios necesitan una revisión adicional",
            }),
          },
        );

        assert.equal(res.status, 200);

        const revisada = (await res.json()) as {
          status: string;
          rejectionReason: string | null;
        };

        assert.equal(revisada.status, "rejected");
        assert.equal(
          revisada.rejectionReason,
          "Los cambios necesitan una revisión adicional",
        );

        const proyecto = await obtenerProyecto(projectId);
        assert.equal(proyecto.title, "Proyecto para rechazar");
      });
      it("responde 403 si una empresa intenta rechazar una solicitud", async () => {
        const { projectId, solicitud } = await crearSolicitud(
          { title: "Cambio no autorizado" },
          "Proyecto original",
        );

        const res = await fetch(
          `${base}/project-edit-requests/${solicitud.id}/reject`,
          {
            method: "POST",
            headers: { Cookie: cookie },
            body: JSON.stringify({ reason: "Unauthorized" }),
          },
        );

        assert.equal(res.status, 403);

        const proyecto = await obtenerProyecto(projectId);
        assert.equal(proyecto.title, "Proyecto original");
      });
    });
  });
});
