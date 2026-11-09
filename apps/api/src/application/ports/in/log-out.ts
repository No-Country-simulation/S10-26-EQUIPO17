export interface LogOut {
  /** Revokes the session of the access token. A session that is already closed is not an error. */
  execute(accessToken: string): Promise<void>;
}
