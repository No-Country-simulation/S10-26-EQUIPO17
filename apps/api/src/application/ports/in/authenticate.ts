import type { AuthenticatedUser } from "../out/auth-provider.js";

/** Tells who an access token belongs to; throws NoAutenticadoError if it is not valid. */
export interface Authenticate {
  execute(accessToken: string): Promise<AuthenticatedUser>;
}
