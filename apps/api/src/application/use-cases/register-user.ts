import { User } from "../../domain/entities/user.js";
import { ConflictoError } from "../../domain/errors.js";
import { Email } from "../../domain/value-objects/email.js";
import type { RegisterUser, RegisterUserData } from "../ports/in/register-user.js";
import type { GeneradorDeIds } from "../ports/out/generador-de-ids.js";
import type { HasherDeClaves } from "../ports/out/hasher-de-claves.js";
import type { UserRepository } from "../ports/out/user-repository.js";

export class RegisterUserUseCase implements RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: HasherDeClaves,
    private readonly ids: GeneradorDeIds,
  ) {}

  async execute(data: RegisterUserData): Promise<User> {
    const email = Email.create(data.email);
    User.validatePlainPassword(data.password);

    if (await this.users.findByEmail(email)) {
      throw new ConflictoError("A user with that email already exists");
    }

    const user = User.create({
      id: this.ids.generar(),
      email,
      passwordHash: await this.hasher.hashear(data.password),
    });
    await this.users.save(user);
    return user;
  }
}
