import type { User } from "../../../domain/entities/user.js";

// Read-only: users are created by the auth provider (see AuthProvider).
export interface UserRepository {
  findById(id: string): Promise<User | null>;
}
