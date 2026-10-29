import type { UserRepository } from "../../../../application/ports/out/user-repository.js";
import type { User } from "../../../../domain/entities/user.js";
import type { Email } from "../../../../domain/value-objects/email.js";

/**
 * In-memory implementation of the port. Used by tests and to develop without a database.
 * save, delete and findByEmail are not part of the port: InMemoryAuthProvider uses them to mimic
 * the trigger and the cascade from auth.users.
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.equals(email)) return user;
    }
    return null;
  }
}
