import { User } from "../../domain/entities/user.js";
import { Email } from "../../domain/value-objects/email.js";
import type { Session } from "../ports/in/log-in.js";
import type { RefreshUserSession } from "../ports/in/refresh-user-session.js";
import type { AuthProvider } from "../ports/out/auth-provider.js";

export class RefreshUserSessionUseCase implements RefreshUserSession {
  constructor(private readonly auth: AuthProvider) {}

  async execute(refreshToken: string): Promise<Session> {
    const { userId, email, role, accessToken, ...tokens } =
      await this.auth.refreshSession(refreshToken);
    const user = User.create({ id: userId, email: Email.create(email) });
    return { user, role, accessToken, ...tokens };
  }
}
