import type { AuthProvider } from "../../../application/ports/out/auth-provider.js";
import type { GeneradorDeIds } from "../../../application/ports/out/generador-de-ids.js";
import { User } from "../../../domain/entities/user.js";
import { ConflictoError } from "../../../domain/errors.js";
import type { Email } from "../../../domain/value-objects/email.js";
import type { InMemoryUserRepository } from "../persistence/memory/in-memory-user-repository.js";

/**
 * In-memory implementation of the port. Used by tests and to develop without a database.
 * Saving into the users repository mimics the on_auth_user_created trigger.
 */
export class InMemoryAuthProvider implements AuthProvider {
  constructor(
    private readonly users: InMemoryUserRepository,
    private readonly ids: GeneradorDeIds,
  ) {}

  async register(email: Email, _password: string): Promise<string> {
    if (await this.users.findByEmail(email)) {
      throw new ConflictoError("A user with that email already exists");
    }
    const id = this.ids.generar();
    await this.users.save(User.create({ id, email }));
    return id;
  }
}
