import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { leerConfig } from "../../src/infrastructure/config/env.js";

describe("leerConfig cookies", () => {
  const base = { PERSISTENCIA: "memoria" };

  it("defaults to Secure and SameSite=Lax", () => {
    assert.deepEqual(leerConfig(base).cookies, { secure: true, sameSite: "lax" });
  });

  it("reads COOKIE_SECURE and COOKIE_SAME_SITE", () => {
    assert.deepEqual(
      leerConfig({ ...base, COOKIE_SECURE: "false", COOKIE_SAME_SITE: "strict" }).cookies,
      { secure: false, sameSite: "strict" },
    );
  });

  it("rejects an unknown COOKIE_SAME_SITE", () => {
    assert.throws(() => leerConfig({ ...base, COOKIE_SAME_SITE: "loose" }), /COOKIE_SAME_SITE/);
  });

  it("rejects SameSite=None without Secure, which browsers drop", () => {
    assert.throws(
      () => leerConfig({ ...base, COOKIE_SAME_SITE: "none", COOKIE_SECURE: "false" }),
      /COOKIE_SECURE/,
    );
  });
});

describe("leerConfig CORS_ORIGINS", () => {
  const base = { PERSISTENCIA: "memoria" };

  it("allows no cross-origin requests by default", () => {
    assert.deepEqual(leerConfig(base).corsOrigins, []);
  });

  it("reads a comma separated list of exact origins", () => {
    assert.deepEqual(
      leerConfig({ ...base, CORS_ORIGINS: " http://127.0.0.1:5173, https://web.ejemplo.com " })
        .corsOrigins,
      ["http://127.0.0.1:5173", "https://web.ejemplo.com"],
    );
  });

  it("rejects anything that is not an exact origin", () => {
    for (const valor of [
      "*",
      "null",
      "web.ejemplo.com",
      "https://web.ejemplo.com/",
      "https://web.ejemplo.com/app",
      "https://*.ejemplo.com",
      "ftp://web.ejemplo.com",
      "https://web.ejemplo.com,",
    ]) {
      assert.throws(() => leerConfig({ ...base, CORS_ORIGINS: valor }), /CORS_ORIGINS/, valor);
    }
  });
});
