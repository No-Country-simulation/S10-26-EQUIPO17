import type { Email } from "../../../domain/value-objects/email.js";
import type { UserRole } from "../../../domain/value-objects/user-role.js";

/** Identity service that owns credentials. The API never stores passwords. */
export interface AuthProvider {
  /** Creates an active user and returns the id the provider assigned to it. */
  register(email: Email, password: string, role?: UserRole): Promise<string>;
  /** Deletes a user; used to undo a registration that could not be completed. */
  remove(id: string): Promise<void>;
}
