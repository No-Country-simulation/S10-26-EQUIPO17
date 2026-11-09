import { NoAutenticadoError } from "../../domain/errors.js";
import type { LogOut } from "../ports/in/log-out.js";
import type { AuthProvider } from "../ports/out/auth-provider.js";

export class LogOutUseCase implements LogOut {
  constructor(private readonly auth: AuthProvider) {}

  async execute(accessToken: string): Promise<void> {
    try {
      await this.auth.logOut(accessToken);
    } catch (error) {
      // The user wants the session closed, and a refused token means it already is.
      if (!(error instanceof NoAutenticadoError)) throw error;
    }
  }
}
