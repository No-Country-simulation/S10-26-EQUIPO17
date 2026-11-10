import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { LogOutUseCase } from "../../src/application/use-cases/log-out.js";
import { InMemoryAuthProvider } from "../../src/adapters/out/auth/in-memory-auth-provider.js";
import { GeneradorDeIdsUuid } from "../../src/adapters/out/ids/generador-de-ids-uuid.js";
import { InMemoryUserRepository } from "../../src/adapters/out/persistence/memory/in-memory-user-repository.js";
import { NoAutenticadoError } from "../../src/domain/errors.js";
import { Email } from "../../src/domain/value-objects/email.js";

describe("LogOut", () => {
  const email = Email.create("ana@ejemplo.com");
  let auth: InMemoryAuthProvider;
  let logOut: LogOutUseCase;

  beforeEach(async () => {
    auth = new InMemoryAuthProvider(new InMemoryUserRepository(), new GeneradorDeIdsUuid());
    logOut = new LogOutUseCase(auth);
    await auth.register(email, "clave-segura", "company");
  });

  it("revokes the session: neither of its tokens works afterwards", async () => {
    const session = await auth.logIn(email, "clave-segura");

    await logOut.execute(session.accessToken);

    await assert.rejects(auth.verifyAccessToken(session.accessToken), NoAutenticadoError);
    await assert.rejects(auth.refreshSession(session.refreshToken), NoAutenticadoError);
  });

  it("revokes a renewed session, including the access token issued before the refresh", async () => {
    const login = await auth.logIn(email, "clave-segura");
    const renewed = await auth.refreshSession(login.refreshToken);

    await logOut.execute(renewed.accessToken);

    await assert.rejects(auth.verifyAccessToken(login.accessToken), NoAutenticadoError);
    await assert.rejects(auth.refreshSession(renewed.refreshToken), NoAutenticadoError);
  });

  it("leaves the user's other sessions alive", async () => {
    const closed = await auth.logIn(email, "clave-segura");
    const other = await auth.logIn(email, "clave-segura");

    await logOut.execute(closed.accessToken);

    assert.ok(await auth.verifyAccessToken(other.accessToken));
    assert.ok(await auth.refreshSession(other.refreshToken));
  });

  it("succeeds when the session was already closed or the token is unknown", async () => {
    const session = await auth.logIn(email, "clave-segura");
    await logOut.execute(session.accessToken);

    await logOut.execute(session.accessToken);
    await logOut.execute("desconocido");
  });

  it("propagates an outage of the provider", async (t) => {
    const outage = new Error("Supabase Auth: boom");
    t.mock.method(auth, "logOut", async () => {
      throw outage;
    });

    await assert.rejects(logOut.execute("cualquiera"), (error) => error === outage);
  });
});
