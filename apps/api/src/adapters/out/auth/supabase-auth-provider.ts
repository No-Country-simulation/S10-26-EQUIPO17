import {
  isAuthApiError,
  isAuthSessionMissingError,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type {
  AuthenticatedUser,
  AuthProvider,
  AuthSession,
  RefreshedAuthSession,
} from "../../../application/ports/out/auth-provider.js";
import {
  ConflictoError,
  CredencialesInvalidasError,
  NoAutenticadoError,
} from "../../../domain/errors.js";
import type { Email } from "../../../domain/value-objects/email.js";
import { isUserRole, type UserRole } from "../../../domain/value-objects/user-role.js";

/** Printable ASCII without spaces: anything else cannot be sent in the Authorization header. */
const HEADER_SAFE_TOKEN = /^[\x21-\x7e]+$/;

/** Codes Supabase answers with when the refresh token or its session can no longer be used. */
const REFRESH_REFUSAL_CODES: ReadonlySet<string | undefined> = new Set([
  // The token is the only input, so this means its format is impossible (a tampered cookie).
  "validation_failed",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_not_found",
  "session_expired",
  "user_not_found",
  "user_banned",
]);

// Otherwise fetch throws while building the request, which looks just like a network failure.
function assertHeaderSafe(accessToken: string): void {
  if (!HEADER_SAFE_TOKEN.test(accessToken)) {
    throw new NoAutenticadoError();
  }
}

/**
 * Whether Supabase refused an access token: invalid, expired, its session revoked or its user
 * deleted. A revoked session comes back as AuthSessionMissingError, not as an AuthApiError.
 */
function isAccessTokenRefusal(error: unknown): boolean {
  return (
    isAuthSessionMissingError(error) ||
    (isAuthApiError(error) && (error.status === 401 || error.status === 403))
  );
}

// The on_auth_user_created trigger (see supabase/migrations) copies the new
// auth.users row into public.users, so this adapter only talks to Auth.
export class SupabaseAuthProvider implements AuthProvider {
  /**
   * @param supabase shared admin client, used for user management.
   * @param createSessionClient returns a new client for each login or refresh: both store the
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

  async refreshSession(refreshToken: string): Promise<RefreshedAuthSession> {
    const { data, error } = await this.createSessionClient().auth.refreshSession({
      refresh_token: refreshToken,
    });
    // Only a refusal means "not logged in"; an outage must not end the user's session.
    if (
      isAuthSessionMissingError(error) ||
      (isAuthApiError(error) && REFRESH_REFUSAL_CODES.has(error.code))
    ) {
      throw new NoAutenticadoError();
    }
    if (error || !data.user?.email || !data.session) {
      throw new Error(`Supabase Auth: ${error?.message ?? "incomplete session returned"}`, {
        cause: error,
      });
    }
    const role = data.user.app_metadata.role;
    return {
      userId: data.user.id,
      email: data.user.email,
      role: isUserRole(role) ? role : null,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  // Passing the token keeps the shared client stateless: no session is stored in it.
  async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    assertHeaderSafe(accessToken);
    const { data, error } = await this.supabase.auth.getUser(accessToken);
    // Only a refusal means "not logged in"; an outage has to surface as a server error.
    if (isAccessTokenRefusal(error)) {
      throw new NoAutenticadoError();
    }
    if (error || !data.user?.email) {
      throw new Error(`Supabase Auth: ${error?.message ?? "incomplete user returned"}`, {
        cause: error,
      });
    }
    const role = data.user.app_metadata.role;
    return {
      userId: data.user.id,
      email: data.user.email,
      role: isUserRole(role) ? role : null,
    };
  }

  // "local" closes only this session. Supabase needs a valid access token for it: an expired one
  // is refused, and its refresh token stays usable on Supabase's side.
  async logOut(accessToken: string): Promise<void> {
    assertHeaderSafe(accessToken);
    const { error } = await this.supabase.auth.admin.signOut(accessToken, "local");
    if (isAccessTokenRefusal(error)) {
      throw new NoAutenticadoError();
    }
    if (error) {
      throw new Error(`Supabase Auth: ${error.message}`, { cause: error });
    }
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
