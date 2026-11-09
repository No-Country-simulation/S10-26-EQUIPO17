import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { SupabaseAuthProvider } from "../../src/adapters/out/auth/supabase-auth-provider.js";
import {
  ConflictoError,
  CredencialesInvalidasError,
  NoAutenticadoError,
} from "../../src/domain/errors.js";
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

describe("SupabaseAuthProvider.refreshSession", () => {
  type RefreshResult = {
    data: {
      user: { id: string; email?: string; app_metadata: Record<string, unknown> } | null;
      session: { access_token: string; refresh_token: string; expires_in: number } | null;
    };
    error: Error | null;
  };

  const admin = fakeSupabase({ data: { user: null }, error: null });

  /** Each call returns a new client, as the real factory does. */
  function refreshClients(result: RefreshResult, refreshes: unknown[] = []) {
    const clients: SupabaseClient[] = [];
    const create = () => {
      const client = {
        auth: {
          refreshSession: async (session: unknown) => {
            refreshes.push(session);
            return result;
          },
        },
      } as unknown as SupabaseClient;
      clients.push(client);
      return client;
    };
    return { create, clients };
  }

  const refreshed = (role: unknown): RefreshResult => ({
    data: {
      user: {
        id: "auth-id",
        email: "ana@ejemplo.com",
        app_metadata: role === undefined ? {} : { role },
      },
      session: { access_token: "new-access", refresh_token: "new-refresh", expires_in: 3600 },
    },
    error: null,
  });

  const rejected = (error: Error): RefreshResult => ({
    data: { user: null, session: null },
    error,
  });

  it("refreshes on a new client and maps the session, email and role", async () => {
    const refreshes: unknown[] = [];
    const sessions = refreshClients(refreshed("company"), refreshes);
    const auth = providerWith(admin, sessions.create);

    assert.deepEqual(await auth.refreshSession("refresh"), {
      userId: "auth-id",
      email: "ana@ejemplo.com",
      role: "company",
      accessToken: "new-access",
      refreshToken: "new-refresh",
      expiresIn: 3600,
    });
    await auth.refreshSession("refresh");

    assert.deepEqual(refreshes, [{ refresh_token: "refresh" }, { refresh_token: "refresh" }]);
    // Never reuses a client, so one user's session cannot leak into another request.
    assert.equal(sessions.clients.length, 2);
    assert.notEqual(sessions.clients[0], sessions.clients[1]);
  });

  it("returns a null role when app_metadata has none or an unknown one", async () => {
    for (const role of [undefined, "admin"]) {
      const auth = providerWith(admin, refreshClients(refreshed(role)).create);
      assert.equal((await auth.refreshSession("refresh")).role, null);
    }
  });

  it("translates a token Supabase refuses", async () => {
    const refusals = [
      // What Supabase answers for a token with an impossible format, such as a tampered cookie.
      new AuthApiError("Refresh token is not valid", 400, "validation_failed"),
      new AuthApiError("not found", 400, "refresh_token_not_found"),
      new AuthApiError("already used", 400, "refresh_token_already_used"),
      new AuthApiError("no session", 400, "session_not_found"),
      new AuthApiError("expired", 400, "session_expired"),
      new AuthApiError("user gone", 403, "user_not_found"),
      new AuthApiError("banned", 400, "user_banned"),
      new AuthSessionMissingError(),
    ];

    for (const error of refusals) {
      const auth = providerWith(admin, refreshClients(rejected(error)).create);
      await assert.rejects(auth.refreshSession("refresh"), NoAutenticadoError, error.message);
    }
  });

  it("propagates an outage instead of reporting the user as logged out", async () => {
    const outages = [
      // What auth-js returns for a 5xx or a failed connection, once its retries run out.
      new AuthRetryableFetchError("boom", 503),
      new AuthApiError("boom", 500, "unexpected_failure"),
      new AuthApiError("boom", 429, "over_request_rate_limit"),
    ];

    for (const error of outages) {
      const auth = providerWith(admin, refreshClients(rejected(error)).create);
      await assert.rejects(auth.refreshSession("refresh"), (thrown: Error) => {
        assert.ok(!(thrown instanceof NoAutenticadoError));
        assert.match(thrown.message, /boom/);
        return true;
      });
    }
  });

  it("fails when Supabase returns no session or a user without email", async () => {
    const incomplete: RefreshResult[] = [
      { data: { user: null, session: null }, error: null },
      {
        data: {
          user: { id: "auth-id", app_metadata: {} },
          session: { access_token: "a", refresh_token: "r", expires_in: 3600 },
        },
        error: null,
      },
    ];

    for (const result of incomplete) {
      const auth = providerWith(admin, refreshClients(result).create);
      await assert.rejects(auth.refreshSession("refresh"), (thrown: Error) => {
        assert.ok(!(thrown instanceof NoAutenticadoError));
        return true;
      });
    }
  });
});

describe("SupabaseAuthProvider.verifyAccessToken", () => {
  type GetUserResult = {
    data: { user: { id: string; app_metadata: Record<string, unknown> } | null };
    error: Error | null;
  };

  const adminWith = (result: GetUserResult, tokens: unknown[] = []) =>
    ({
      auth: {
        getUser: async (token: unknown) => {
          tokens.push(token);
          return result;
        },
      },
    }) as unknown as SupabaseClient;

  const rejected = (error: Error): GetUserResult => ({ data: { user: null }, error });

  it("asks Supabase about the token and maps the user id and role", async () => {
    const tokens: unknown[] = [];
    const auth = providerWith(
      adminWith(
        { data: { user: { id: "auth-id", app_metadata: { role: "company" } } }, error: null },
        tokens,
      ),
    );

    assert.deepEqual(await auth.verifyAccessToken("token"), {
      userId: "auth-id",
      role: "company",
    });
    assert.deepEqual(tokens, ["token"]);
  });

  it("returns a null role when app_metadata has none or an unknown one", async () => {
    for (const app_metadata of [{}, { role: "admin" }]) {
      const auth = providerWith(
        adminWith({ data: { user: { id: "auth-id", app_metadata } }, error: null }),
      );
      assert.equal((await auth.verifyAccessToken("token")).role, null);
    }
  });

  it("translates a token Supabase refuses", async () => {
    const refusals = [
      new AuthApiError("invalid JWT", 403, "bad_jwt"),
      // What auth-js returns for session_not_found, for example after a logout.
      new AuthSessionMissingError(),
      new AuthApiError("user gone", 403, "user_not_found"),
      new AuthApiError("unauthorized", 401, "no_authorization"),
    ];

    for (const error of refusals) {
      const auth = providerWith(adminWith(rejected(error)));
      await assert.rejects(auth.verifyAccessToken("token"), NoAutenticadoError, error.message);
    }
  });

  it("refuses a token that cannot travel in a header without calling Supabase", async () => {
    const tokens: unknown[] = [];
    const auth = providerWith(
      adminWith({ data: { user: { id: "auth-id", app_metadata: {} } }, error: null }, tokens),
    );

    for (const token of ["abc\ndef", "abc\0def", "€", "abc def"]) {
      await assert.rejects(auth.verifyAccessToken(token), NoAutenticadoError, token);
    }
    assert.deepEqual(tokens, []);
  });

  it("propagates an outage instead of reporting the user as logged out", async () => {
    const auth = providerWith(
      adminWith(rejected(new AuthApiError("boom", 500, "unexpected_failure"))),
    );

    await assert.rejects(auth.verifyAccessToken("token"), (error: Error) => {
      assert.ok(!(error instanceof NoAutenticadoError));
      assert.match(error.message, /boom/);
      return true;
    });
  });
});

describe("SupabaseAuthProvider.logOut", () => {
  const adminWith = (error: Error | null, calls: unknown[][] = []) =>
    ({
      auth: {
        admin: {
          signOut: async (...args: unknown[]) => {
            calls.push(args);
            return { data: null, error };
          },
        },
      },
    }) as unknown as SupabaseClient;

  it("revokes only the session of the token, on the shared admin client", async () => {
    const calls: unknown[][] = [];
    const auth = providerWith(adminWith(null, calls));

    await auth.logOut("token");

    assert.deepEqual(calls, [["token", "local"]]);
  });

  it("translates a token Supabase refuses", async () => {
    // Measured against local Supabase: expired, tampered, revoked and deleted-user tokens.
    const refusals = [
      new AuthApiError("invalid JWT", 403, "bad_jwt"),
      new AuthSessionMissingError(),
      new AuthApiError("user gone", 403, "user_not_found"),
      new AuthApiError("unauthorized", 401, "no_authorization"),
    ];

    for (const error of refusals) {
      const auth = providerWith(adminWith(error));
      await assert.rejects(auth.logOut("token"), NoAutenticadoError, error.message);
    }
  });

  it("refuses a token that cannot travel in a header without calling Supabase", async () => {
    const calls: unknown[][] = [];
    const auth = providerWith(adminWith(null, calls));

    for (const token of ["abc\ndef", "€", "abc def"]) {
      await assert.rejects(auth.logOut(token), NoAutenticadoError, token);
    }
    assert.deepEqual(calls, []);
  });

  it("propagates an outage instead of reporting the session as closed", async () => {
    const outages = [
      new AuthRetryableFetchError("fetch failed", 0),
      new AuthApiError("boom", 500, "unexpected_failure"),
    ];

    for (const outage of outages) {
      const auth = providerWith(adminWith(outage));
      await assert.rejects(auth.logOut("token"), (error: Error) => {
        assert.ok(!(error instanceof NoAutenticadoError));
        assert.match(error.message, new RegExp(outage.message));
        return true;
      });
    }
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
