import type { Authenticate } from "../ports/in/authenticate.js";
import type { AuthenticatedUser, AuthProvider } from "../ports/out/auth-provider.js";

export class AuthenticateUseCase implements Authenticate {
  constructor(private readonly auth: AuthProvider) {}

  execute(accessToken: string): Promise<AuthenticatedUser> {
    return this.auth.verifyAccessToken(accessToken);
  }
}
