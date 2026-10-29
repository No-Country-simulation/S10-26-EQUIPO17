import { isAuthApiError, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthProvider,
  AuthSession,
} from "../../../application/ports/out/auth-provider.js";
import { ConflictoError, CredencialesInvalidasError } from "../../../domain/errors.js";
import type { Email } from "../../../domain/value-objects/email.js";
import { isUserRole, type UserRole } from "../../../domain/value-objects/user-role.js";

// The on_auth_user_created trigger (see supabase/migrations) copies the new
// auth.users row into public.users, so this adapter only talks to Auth.
export class SupabaseAuthProvider implements AuthProvider {
  /**
   * @param supabase shared admin client, used for user management.
   * @param createSessionClient returns a new client for each login: signing in stores the
   *   session in the client and later requests run as that user, so it must never be shared.
   */
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly createSessionClient: () => SupabaseClient,
  ) {}

  async logIn(email: Email, password: string): Promise<AuthSession> {
    const { data, error } = await this.createSessionClient().auth.signInWithPassword({
      email: email.value,
      password,
    });
    if (isAuthApiError(error) && error.code === "invalid_credentials") {
      throw new CredencialesInvalidasError();
    }
    if (error || !data.user || !data.session) {
      throw new Error(`Supabase Auth: ${error?.message ?? "no session returned"}`, {
        cause: error,
      });
    }
    const role = data.user.app_metadata.role;
    return {
      userId: data.user.id,
      role: isUserRole(role) ? role : null,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

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
