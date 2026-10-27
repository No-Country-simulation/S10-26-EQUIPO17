import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRepository } from "../../../../application/ports/out/user-repository.js";
import type { User } from "../../../../domain/entities/user.js";
import type { Email } from "../../../../domain/value-objects/email.js";
import {
  rowToUser,
  TEXTO_NO_ES_UUID,
  traducirError,
  USER_COLUMNS,
  userToRow,
  type UserRow,
} from "./filas.js";

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(user: User): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .upsert(userToRow(user));
    if (error) throw traducirError(error);
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select(USER_COLUMNS)
      .eq("id", id)
      .maybeSingle<UserRow>();
    // An id that is not a UUID cannot exist in the table.
    if (error?.code === TEXTO_NO_ES_UUID) return null;
    if (error) throw traducirError(error);
    return data ? rowToUser(data) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select(USER_COLUMNS)
      .eq("email", email.value)
      .maybeSingle<UserRow>();
    if (error) throw traducirError(error);
    return data ? rowToUser(data) : null;
  }
}
