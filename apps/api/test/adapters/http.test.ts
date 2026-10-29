import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { crearCasosDeUso, crearDependencias } from "../../src/infrastructure/container.js";
import { crearApp } from "../../src/infrastructure/http/app.js";

// Levanta la app real con los adaptadores en memoria y le pega por HTTP.
describe("API HTTP", () => {
  let server: Server;
  let base: string;
  const cookies = { secure: true, sameSite: "lax" } as const;

  before(async () => {
    const casos = crearCasosDeUso(
      crearDependencias({ puerto: 0, persistencia: "memoria", supabase: null, cookies }),
    );
    server = crearApp(casos, cookies).listen(0);
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

  it("GET / responde el health check", async () => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "ok" });
  });

  it("registra un usuario sin exponer la clave y crea una company asociada", async () => {
    const resUser = await post(
      "/users",
      JSON.stringify({ email: "ana@ejemplo.com", password: "clave-segura" }),
    );
    assert.equal(resUser.status, 201);
    const user = (await resUser.json()) as Record<string, unknown>;
    assert.deepEqual(Object.keys(user).sort(), ["email", "id"]);

    const resCompany = await post(
      "/companies",
      JSON.stringify({
        firstName: "Ana",
        lastName: "García",
        jobPosition: "CTO",
        companyName: "Acme",
        country: "Argentina",
        businessSector: "Technology",
        interests: ["Evaluate talent in real work experience"],
        userId: user.id,
      }),
    );
    assert.equal(resCompany.status, 201);
    const company = (await resCompany.json()) as { id: string };

    const resGet = await fetch(`${base}/companies/${company.id}`);
    assert.equal(resGet.status, 200);
    assert.deepEqual(await resGet.json(), {
      id: company.id,
      firstName: "Ana",
      lastName: "García",
      jobPosition: "CTO",
      companyName: "Acme",
      country: "Argentina",
      businessSector: "Technology",
      interests: ["Evaluate talent in real work experience"],
      user: { id: user.id, email: "ana@ejemplo.com" },
    });
  });

  it("traduce los errores de dominio a códigos HTTP", async () => {
    const duplicado = JSON.stringify({ email: "dup@ejemplo.com", password: "clave-segura" });
    assert.equal((await post("/users", duplicado)).status, 201);
    assert.equal((await post("/users", duplicado)).status, 409);

    assert.equal((await post("/companies", JSON.stringify({ companyName: "Acme" }))).status, 400);
    assert.equal((await fetch(`${base}/companies/no-existe`)).status, 404);
  });

  it("responde 400 ante un country, businessSector o interest inválido", async () => {
    const valid = {
      firstName: "Ana",
      lastName: "García",
      jobPosition: "CTO",
      companyName: "Acme",
      country: "Argentina",
      businessSector: "Technology",
      interests: ["Evaluate talent in real work experience"],
    };
    const cases = [
      { override: { country: "Narnia" }, error: "Invalid country: Narnia" },
      { override: { businessSector: "Magic" }, error: "Invalid business sector: Magic" },
      { override: { interests: ["Nope"] }, error: "Invalid interests: Nope" },
      { override: { interests: [] }, error: "At least one interest is required" },
    ];

    for (const { override, error } of cases) {
      const res = await post("/companies", JSON.stringify({ ...valid, ...override }));
      assert.equal(res.status, 400, JSON.stringify(override));
      assert.deepEqual(await res.json(), { error });
    }
  });

  it("responde 400 si interests no es una lista de textos", async () => {
    const res = await post(
      "/companies",
      JSON.stringify({
        firstName: "Ana",
        lastName: "García",
        jobPosition: "CTO",
        companyName: "Acme",
        country: "Argentina",
        businessSector: "Technology",
        interests: "Evaluate talent in real work experience",
      }),
    );
    assert.equal(res.status, 400);
  });

  it("responde 400 ante JSON mal formado", async () => {
    const res = await post("/companies", "{ no es json");
    assert.equal(res.status, 400);
  });

  it("responde 404 al crear una company con un userId inexistente", async () => {
    const res = await post(
      "/companies",
      JSON.stringify({
        firstName: "Ana",
        lastName: "García",
        jobPosition: "CTO",
        companyName: "Acme",
        country: "Argentina",
        businessSector: "Technology",
        interests: ["Evaluate talent in real work experience"],
        userId: "no-existe",
      }),
    );

    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: "User no-existe does not exist" });
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
      interests: ["Evaluate talent in real work experience"],
    };

    it("crea el usuario y la company en una sola request", async () => {
      const res = await post("/companies/register", JSON.stringify(registro));
      assert.equal(res.status, 201);
      const company = (await res.json()) as { id: string; user: { id: string } };

      const resGet = await fetch(`${base}/companies/${company.id}`);
      assert.deepEqual(await resGet.json(), {
        id: company.id,
        firstName: "Ana",
        lastName: "García",
        jobPosition: "CTO",
        companyName: "Acme",
        country: "Argentina",
        businessSector: "Technology",
        interests: ["Evaluate talent in real work experience"],
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
          interests: ["Evaluate talent in real work experience"],
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
