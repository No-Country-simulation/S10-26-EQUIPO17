import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthApiError, type SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAuthProvider } from "../../src/adapters/out/auth/supabase-auth-provider.js";
import { ConflictoError } from "../../src/domain/errors.js";
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

describe("SupabaseAuthProvider", () => {
  const email = Email.create("ana@ejemplo.com");

  it("creates an already confirmed user and returns its id", async () => {
    const calls: unknown[] = [];
    const auth = new SupabaseAuthProvider(
      fakeSupabase({ data: { user: { id: "auth-id" } }, error: null }, calls),
    );

    assert.equal(await auth.register(email, "clave-segura"), "auth-id");
    assert.deepEqual(calls, [
      { email: "ana@ejemplo.com", password: "clave-segura", email_confirm: true },
    ]);
  });

  it("stores the role in app_metadata so it travels in the JWT", async () => {
    const calls: unknown[] = [];
    const auth = new SupabaseAuthProvider(
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
    const auth = new SupabaseAuthProvider(
      fakeSupabase({ data: { user: null }, error: null }, calls),
    );

    await auth.remove("auth-id");
    assert.deepEqual(calls, [{ deleted: "auth-id" }]);
  });

  it("propagates a failed deletion", async () => {
    const auth = new SupabaseAuthProvider(
      fakeSupabase(
        { data: { user: null }, error: null },
        [],
        new AuthApiError("gone", 500, "unexpected_failure"),
      ),
    );

    await assert.rejects(auth.remove("auth-id"), /gone/);
  });

  it("translates an existing email into a conflict", async () => {
    const auth = new SupabaseAuthProvider(
      fakeSupabase({
        data: { user: null },
        error: new AuthApiError("already registered", 422, "email_exists"),
      }),
    );

    await assert.rejects(auth.register(email, "clave-segura"), ConflictoError);
  });

  it("propagates any other error", async () => {
    const auth = new SupabaseAuthProvider(
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
