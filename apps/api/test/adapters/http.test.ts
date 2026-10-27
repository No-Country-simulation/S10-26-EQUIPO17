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

  before(async () => {
    const casos = crearCasosDeUso(
      crearDependencias({ puerto: 0, persistencia: "memoria", supabase: null }),
    );
    server = crearApp(casos).listen(0);
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

  it("responde 400 ante JSON mal formado", async () => {
    const res = await post("/companies", "{ no es json");
    assert.equal(res.status, 400);
  });
});
