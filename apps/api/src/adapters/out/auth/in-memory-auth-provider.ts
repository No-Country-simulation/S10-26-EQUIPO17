import type { AuthProvider } from "../../../application/ports/out/auth-provider.js";
import type { GeneradorDeIds } from "../../../application/ports/out/generador-de-ids.js";
import { User } from "../../../domain/entities/user.js";
import { ConflictoError } from "../../../domain/errors.js";
import type { Email } from "../../../domain/value-objects/email.js";
import type { UserRole } from "../../../domain/value-objects/user-role.js";
import type { InMemoryUserRepository } from "../persistence/memory/in-memory-user-repository.js";

/**
 * In-memory implementation of the port. Used by tests and to develop without a database.
 * Saving into the users repository mimics the on_auth_user_created trigger.
 */
export class InMemoryAuthProvider implements AuthProvider {
  private readonly roles = new Map<string, UserRole>();

  constructor(
    private readonly users: InMemoryUserRepository,
    private readonly ids: GeneradorDeIds,
  ) {}

  async register(email: Email, _password: string, role?: UserRole): Promise<string> {
    if (await this.users.findByEmail(email)) {
      throw new ConflictoError("A user with that email already exists");
    }
    const id = this.ids.generar();
    await this.users.save(User.create({ id, email }));
    if (role) this.roles.set(id, role);
    return id;
  }

  async remove(id: string): Promise<void> {
    this.roles.delete(id);
    await this.users.delete(id);
  }

  /** Not part of the port: lets tests check the role a user was registered with. */
  roleOf(id: string): UserRole | null {
    return this.roles.get(id) ?? null;
  }
}
