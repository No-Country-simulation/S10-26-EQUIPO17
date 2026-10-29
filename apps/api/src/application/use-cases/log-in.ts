import { User } from "../../domain/entities/user.js";
import { Email } from "../../domain/value-objects/email.js";
import type { LogIn, LogInData, Session } from "../ports/in/log-in.js";
import type { AuthProvider } from "../ports/out/auth-provider.js";

export class LogInUseCase implements LogIn {
  constructor(private readonly auth: AuthProvider) {}

  // The password length rule is not checked here: it applies when choosing a password,
  // and a wrong password must fail like any other bad credentials.
  async execute(data: LogInData): Promise<Session> {
    const email = Email.create(data.email);
    const { userId, role, accessToken, refreshToken, expiresIn } = await this.auth.logIn(
      email,
      data.password,
    );
    return { user: User.create({ id: userId, email }), role, accessToken, refreshToken, expiresIn };
  }
}
