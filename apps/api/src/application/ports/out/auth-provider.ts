import type { Email } from "../../../domain/value-objects/email.js";

/** Identity service that owns credentials. The API never stores passwords. */
export interface AuthProvider {
  /** Creates an active user and returns the id the provider assigned to it. */
  register(email: Email, password: string): Promise<string>;
}
