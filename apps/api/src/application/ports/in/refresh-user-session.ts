import type { Session } from "./log-in.js";

export interface RefreshUserSession {
  /** Trades a refresh token for a new session; throws NoAutenticadoError if it is not valid. */
  execute(refreshToken: string): Promise<Session>;
}
