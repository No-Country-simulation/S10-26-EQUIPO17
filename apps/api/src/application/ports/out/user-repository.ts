import type { User } from "../../../domain/entities/user.js";
import type { Email } from "../../../domain/value-objects/email.js";

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
}
