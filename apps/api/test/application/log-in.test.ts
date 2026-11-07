import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { LogInUseCase } from "../../src/application/use-cases/log-in.js";
import { InMemoryAuthProvider } from "../../src/adapters/out/auth/in-memory-auth-provider.js";
import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { InMemoryUserRepository } from "../../src/adapters/out/persistence/memory/in-memory-user-repository.js";
import { CredencialesInvalidasError, ValidacionError } from "../../src/domain/errors.js";
import { Email } from "../../src/domain/value-objects/email.js";

describe("LogIn", () => {
  let auth: InMemoryAuthProvider;
  let logIn: LogInUseCase;

  beforeEach(() => {
    auth = new InMemoryAuthProvider(new InMemoryUserRepository(), new GeneradorDeIdsUuid());
    logIn = new LogInUseCase(auth);
  });

  it("returns the session with the user's role", async () => {
    const id = await auth.register(Email.create("ana@ejemplo.com"), "clave-segura", "company");

    const session = await logIn.execute({ email: " ANA@ejemplo.com ", password: "clave-segura" });

    assert.equal(session.user.id, id);
    assert.equal(session.user.email.value, "ana@ejemplo.com");
    assert.equal(session.role, "company");
    assert.ok(session.accessToken);
    assert.ok(session.refreshToken);
    assert.ok(session.expiresIn > 0);
  });

  it("returns a null role for a user registered without one", async () => {
    await auth.register(Email.create("ana@ejemplo.com"), "clave-segura");

    const session = await logIn.execute({ email: "ana@ejemplo.com", password: "clave-segura" });

    assert.equal(session.role, null);
  });

  it("rejects a wrong password", async () => {
    await auth.register(Email.create("ana@ejemplo.com"), "clave-segura", "company");

    await assert.rejects(
      logIn.execute({ email: "ana@ejemplo.com", password: "otra-clave" }),
      CredencialesInvalidasError,
    );
  });

  it("rejects an unknown email with the same error as a wrong password", async () => {
    await assert.rejects(
      logIn.execute({ email: "nadie@ejemplo.com", password: "clave-segura" }),
      { name: "CredencialesInvalidasError", message: "Invalid email or password" },
    );
  });

  it("rejects a malformed email", async () => {
    await assert.rejects(
      logIn.execute({ email: "not-an-email", password: "clave-segura" }),
      ValidacionError,
    );
  });
});
