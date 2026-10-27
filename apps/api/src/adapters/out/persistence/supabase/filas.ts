// Forma de las filas en Postgres (ver supabase/migrations) y su traducción a entidades.
// El dominio no conoce nombres de columnas: eso queda encerrado acá.
import type { PostgrestError } from "@supabase/supabase-js";
import { Empresa } from "../../../../domain/entities/empresa.js";
import { User } from "../../../../domain/entities/user.js";
import { ConflictoError } from "../../../../domain/errors.js";
import { Email } from "../../../../domain/value-objects/email.js";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}

export interface FilaEmpresa {
  id: string;
  nombre: string;
  pais: string;
  user_id: string | null;
}

export type FilaEmpresaConUser = Omit<FilaEmpresa, "user_id"> & {
  user: UserRow | null;
};

export const USER_COLUMNS = "id, email, password_hash";
export const COLUMNAS_EMPRESA_CON_USER = `id, nombre, pais, user:users(${USER_COLUMNS})`;

export const userToRow = (user: User): UserRow => ({
  id: user.id,
  email: user.email.value,
  password_hash: user.passwordHash,
});

export const rowToUser = (row: UserRow): User =>
  User.create({
    id: row.id,
    email: Email.create(row.email),
    passwordHash: row.password_hash,
  });

export const empresaAFila = (empresa: Empresa): FilaEmpresa => ({
  id: empresa.id,
  nombre: empresa.nombre,
  pais: empresa.pais,
  user_id: empresa.user?.id ?? null,
});

export const filaAEmpresa = (fila: FilaEmpresaConUser): Empresa =>
  Empresa.crear({
    id: fila.id,
    nombre: fila.nombre,
    pais: fila.pais,
    user: fila.user ? rowToUser(fila.user) : null,
  });

// Códigos de error de Postgres que el adaptador traduce.
const VIOLACION_UNICA = "23505";
export const TEXTO_NO_ES_UUID = "22P02";

export function traducirError(error: PostgrestError): Error {
  if (error.code === VIOLACION_UNICA) {
    return new ConflictoError("El registro ya existe");
  }
  return new Error(`Supabase: ${error.message}`, { cause: error });
}
