import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthApiError, type SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAuthProvider } from "../../src/adapters/out/auth/supabase-auth-provider.js";
import { ConflictoError, CredencialesInvalidasError } from "../../src/domain/errors.js";
import { Email } from "../../src/domain/value-objects/email.js";

type CreateUserResult = { data: { user: { id: string } | null }; error: Error | null };

function fakeSupabase(
  result: CreateUserResult,
  calls: unknown[] = [],
  deleteError: Error | null = null,
): SupabaseClient {
  return {
    auth: {
      admin: {
        createUser: async (attributes: unknown) => {
          calls.push(attributes);
          return result;
        },
        deleteUser: async (id: string) => {
          calls.push({ deleted: id });
          return { data: { user: null }, error: deleteError };
        },
      },
    },
  } as unknown as SupabaseClient;
}

type SignInResult = {
  data: {
    user: { id: string; app_metadata: Record<string, unknown> } | null;
    session: { access_token: string; refresh_token: string; expires_in: number } | null;
  };
  error: Error | null;
};

/** Each call returns a new client, as the real factory does; signIns records every login. */
function fakeSessionClients(result: SignInResult, signIns: unknown[] = []) {
  const clients: SupabaseClient[] = [];
  const create = () => {
    const client = {
      auth: {
        signInWithPassword: async (credentials: unknown) => {
          signIns.push(credentials);
          return result;
        },
      },
    } as unknown as SupabaseClient;
    clients.push(client);
    return client;
  };
  return { create, clients };
}

const unusedSessionClient = () => {
  throw new Error("This test must not create a session client");
};

function providerWith(
  admin: SupabaseClient,
  createSessionClient: () => SupabaseClient = unusedSessionClient,
): SupabaseAuthProvider {
  return new SupabaseAuthProvider(admin, createSessionClient);
}

const signedIn = (role: unknown): SignInResult => ({
  data: {
    user: { id: "auth-id", app_metadata: role === undefined ? {} : { role } },
    session: { access_token: "access", refresh_token: "refresh", expires_in: 3600 },
  },
  error: null,
});

describe("SupabaseAuthProvider.logIn", () => {
  const email = Email.create("ana@ejemplo.com");
  const admin = fakeSupabase({ data: { user: null }, error: null });

  it("signs in on a new client and maps the session and role", async () => {
    const signIns: unknown[] = [];
    const sessions = fakeSessionClients(signedIn("company"), signIns);
    const auth = providerWith(admin, sessions.create);

    assert.deepEqual(await auth.logIn(email, "clave-segura"), {
      userId: "auth-id",
      role: "company",
      accessToken: "access",
      refreshToken: "refresh",
      expiresIn: 3600,
    });
    await auth.logIn(email, "clave-segura");

    assert.deepEqual(signIns, [
      { email: "ana@ejemplo.com", password: "clave-segura" },
      { email: "ana@ejemplo.com", password: "clave-segura" },
    ]);
    // Never reuses a client, so one user's session cannot leak into another request.
    assert.equal(sessions.clients.length, 2);
    assert.notEqual(sessions.clients[0], sessions.clients[1]);
  });

  it("returns a null role when app_metadata has none or an unknown one", async () => {
    for (const role of [undefined, "admin"]) {
      const auth = providerWith(admin, fakeSessionClients(signedIn(role)).create);
      assert.equal((await auth.logIn(email, "clave-segura")).role, null);
    }
  });

  it("translates invalid credentials", async () => {
    const auth = providerWith(
      admin,
      fakeSessionClients({
        data: { user: null, session: null },
        error: new AuthApiError("Invalid login credentials", 400, "invalid_credentials"),
      }).create,
    );

    await assert.rejects(auth.logIn(email, "otra-clave"), CredencialesInvalidasError);
  });

  it("propagates any other error", async () => {
    const auth = providerWith(
      admin,
      fakeSessionClients({
        data: { user: null, session: null },
        error: new AuthApiError("boom", 500, "unexpected_failure"),
      }).create,
    );

    await assert.rejects(auth.logIn(email, "clave-segura"), (error: Error) => {
      assert.ok(!(error instanceof CredencialesInvalidasError));
      assert.match(error.message, /boom/);
      return true;
    });
  });
});

describe("SupabaseAuthProvider", () => {
  const email = Email.create("ana@ejemplo.com");

  it("creates an already confirmed user and returns its id", async () => {
    const calls: unknown[] = [];
    const auth = providerWith(
      fakeSupabase({ data: { user: { id: "auth-id" } }, error: null }, calls),
    );

    assert.equal(await auth.register(email, "clave-segura"), "auth-id");
    assert.deepEqual(calls, [
      { email: "ana@ejemplo.com", password: "clave-segura", email_confirm: true },
    ]);
  });

  it("stores the role in app_metadata so it travels in the JWT", async () => {
    const calls: unknown[] = [];
    const auth = providerWith(
      fakeSupabase({ data: { user: { id: "auth-id" } }, error: null }, calls),
    );

    await auth.register(email, "clave-segura", "company");
    assert.deepEqual(calls, [
      {
        email: "ana@ejemplo.com",
        password: "clave-segura",
        email_confirm: true,
        app_metadata: { role: "company" },
      },
    ]);
  });

  it("deletes a user by id", async () => {
    const calls: unknown[] = [];
    const auth = providerWith(
      fakeSupabase({ data: { user: null }, error: null }, calls),
    );

    await auth.remove("auth-id");
    assert.deepEqual(calls, [{ deleted: "auth-id" }]);
  });

  it("propagates a failed deletion", async () => {
    const auth = providerWith(
      fakeSupabase(
        { data: { user: null }, error: null },
        [],
        new AuthApiError("gone", 500, "unexpected_failure"),
      ),
    );

    await assert.rejects(auth.remove("auth-id"), /gone/);
  });

  it("translates an existing email into a conflict", async () => {
    const auth = providerWith(
      fakeSupabase({
        data: { user: null },
        error: new AuthApiError("already registered", 422, "email_exists"),
      }),
    );

    await assert.rejects(auth.register(email, "clave-segura"), ConflictoError);
  });

  it("propagates any other error", async () => {
    const auth = providerWith(
      fakeSupabase({
        data: { user: null },
        error: new AuthApiError("boom", 500, "unexpected_failure"),
      }),
    );

    await assert.rejects(auth.register(email, "clave-segura"), (error: Error) => {
      assert.ok(!(error instanceof ConflictoError));
      assert.match(error.message, /boom/);
      return true;
    });
  });
});
