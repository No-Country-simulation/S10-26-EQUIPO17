import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRepository } from "../../../../application/ports/out/user-repository.js";
import type { User } from "../../../../domain/entities/user.js";
import {
  rowToUser,
  TEXTO_NO_ES_UUID,
  traducirError,
  USER_COLUMNS,
  type UserRow,
} from "./filas.js";

// public.users is filled by the on_auth_user_created trigger, so this adapter only reads.
export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

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
}
