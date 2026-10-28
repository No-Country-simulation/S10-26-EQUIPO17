import { User } from "../../domain/entities/user.js";
import { Email } from "../../domain/value-objects/email.js";
import type { RegisterUser, RegisterUserData } from "../ports/in/register-user.js";
import type { AuthProvider } from "../ports/out/auth-provider.js";

export class RegisterUserUseCase implements RegisterUser {
  constructor(private readonly auth: AuthProvider) {}

  async execute(data: RegisterUserData): Promise<User> {
    const email = Email.create(data.email);
    User.validatePlainPassword(data.password);

    const id = await this.auth.register(email, data.password);
    return User.create({ id, email });
  }
}
