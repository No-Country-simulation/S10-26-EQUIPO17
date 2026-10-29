import { isAuthApiError, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthProvider } from "../../../application/ports/out/auth-provider.js";
import { ConflictoError } from "../../../domain/errors.js";
import type { Email } from "../../../domain/value-objects/email.js";
import type { UserRole } from "../../../domain/value-objects/user-role.js";

// The on_auth_user_created trigger (see supabase/migrations) copies the new
// auth.users row into public.users, so this adapter only talks to Auth.
export class SupabaseAuthProvider implements AuthProvider {
  constructor(private readonly supabase: SupabaseClient) {}

  async register(email: Email, password: string, role?: UserRole): Promise<string> {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: email.value,
      password,
      // Registration does not require email confirmation.
      email_confirm: true,
      // app_metadata is not editable by the user and is included in the JWT claims.
      ...(role ? { app_metadata: { role } } : {}),
    });
    if (isAuthApiError(error) && error.code === "email_exists") {
      throw new ConflictoError("A user with that email already exists");
    }
    if (error || !data.user) {
      throw new Error(`Supabase Auth: ${error?.message ?? "no user returned"}`, { cause: error });
    }
    return data.user.id;
  }

  // The FK on public.users cascades, so the mirrored row is deleted too.
  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.deleteUser(id);
    if (error) {
      throw new Error(`Supabase Auth: ${error.message}`, { cause: error });
    }
  }
}
