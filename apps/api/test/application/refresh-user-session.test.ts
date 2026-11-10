import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { RefreshUserSessionUseCase } from "../../src/application/use-cases/refresh-user-session.js";
import { InMemoryAuthProvider } from "../../src/adapters/out/auth/in-memory-auth-provider.js";
import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { InMemoryUserRepository } from "../../src/adapters/out/persistence/memory/in-memory-user-repository.js";
import { NoAutenticadoError } from "../../src/domain/errors.js";
import { Email } from "../../src/domain/value-objects/email.js";

describe("RefreshUserSession", () => {
  const email = Email.create("ana@ejemplo.com");
  let auth: InMemoryAuthProvider;
  let refreshUserSession: RefreshUserSessionUseCase;

  beforeEach(() => {
    auth = new InMemoryAuthProvider(new InMemoryUserRepository(), new GeneradorDeIdsUuid());
    refreshUserSession = new RefreshUserSessionUseCase(auth);
  });

  it("returns a new session with the user and role", async () => {
    const id = await auth.register(email, "clave-segura", "company");
    const login = await auth.logIn(email, "clave-segura");

    const session = await refreshUserSession.execute(login.refreshToken);

    assert.equal(session.user.id, id);
    assert.equal(session.user.email.value, "ana@ejemplo.com");
    assert.equal(session.role, "company");
    assert.notEqual(session.accessToken, login.accessToken);
    assert.notEqual(session.refreshToken, login.refreshToken);
    assert.ok(session.expiresIn > 0);
    assert.deepEqual(await auth.verifyAccessToken(session.accessToken), {
      userId: id,
      email: "ana@ejemplo.com",
      role: "company",
    });
  });

  it("returns a null role for a user registered without one", async () => {
    await auth.register(email, "clave-segura");
    const login = await auth.logIn(email, "clave-segura");

    assert.equal((await refreshUserSession.execute(login.refreshToken)).role, null);
  });

  it("accepts the rotated token and rejects the one already used", async () => {
    await auth.register(email, "clave-segura");
    const login = await auth.logIn(email, "clave-segura");

    const session = await refreshUserSession.execute(login.refreshToken);

    await assert.rejects(refreshUserSession.execute(login.refreshToken), NoAutenticadoError);
    assert.ok(await refreshUserSession.execute(session.refreshToken));
  });

  it("rejects an unknown token", async () => {
    await assert.rejects(refreshUserSession.execute("desconocido"), NoAutenticadoError);
  });

  it("rejects the token of a user that was removed", async () => {
    const id = await auth.register(email, "clave-segura");
    const login = await auth.logIn(email, "clave-segura");

    await auth.remove(id);

    await assert.rejects(refreshUserSession.execute(login.refreshToken), NoAutenticadoError);
  });
});
