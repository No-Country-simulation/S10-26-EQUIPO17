import type { Email } from "../../../domain/value-objects/email.js";
import type { UserRole } from "../../../domain/value-objects/user-role.js";

/** Tokens the provider issues on login, plus what it knows about the user. */
export interface AuthSession {
  userId: string;
  /** Null when the user has no role yet, or one this API does not know. */
  role: UserRole | null;
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
}

/** A renewed session. Unlike on login, the caller does not know the user's email yet. */
export interface RefreshedAuthSession extends AuthSession {
  email: string;
}

/** Who an access token belongs to. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  /** Null when the user has no role yet, or one this API does not know. */
  role: UserRole | null;
}

/** Identity service that owns credentials. The API never stores passwords. */
export interface AuthProvider {
  /** Creates an active user and returns the id the provider assigned to it. */
  register(email: Email, password: string, role?: UserRole): Promise<string>;
  /** Deletes a user; used to undo a registration that could not be completed. */
  remove(id: string): Promise<void>;
  /** Checks the credentials; throws CredencialesInvalidasError if they are wrong. */
  logIn(email: Email, password: string): Promise<AuthSession>;
  /**
   * Trades a refresh token for new tokens. The provider rotates it, so the new refresh token has
   * to replace the one received. Throws NoAutenticadoError if the provider refuses it.
   */
  refreshSession(refreshToken: string): Promise<RefreshedAuthSession>;
  /** Checks an access token; throws NoAutenticadoError if the provider refuses it. */
  verifyAccessToken(accessToken: string): Promise<AuthenticatedUser>;
  /**
   * Revokes the session of an access token, refresh token included; the user's other sessions
   * stay open. Throws NoAutenticadoError if the provider refuses the token.
   */
  logOut(accessToken: string): Promise<void>;
}
