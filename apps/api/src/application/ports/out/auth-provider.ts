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

/** Identity service that owns credentials. The API never stores passwords. */
export interface AuthProvider {
  /** Creates an active user and returns the id the provider assigned to it. */
  register(email: Email, password: string, role?: UserRole): Promise<string>;
  /** Deletes a user; used to undo a registration that could not be completed. */
  remove(id: string): Promise<void>;
  /** Checks the credentials; throws CredencialesInvalidasError if they are wrong. */
  logIn(email: Email, password: string): Promise<AuthSession>;
}
