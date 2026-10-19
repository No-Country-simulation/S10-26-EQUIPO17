// Forma de las filas en Postgres (ver supabase/migrations) y su traducción a entidades.
// El dominio no conoce nombres de columnas: eso queda encerrado acá.
import type { PostgrestError } from "@supabase/supabase-js";
import { Empresa } from "../../../../domain/entities/empresa.js";
import { Usuario } from "../../../../domain/entities/usuario.js";
import { ConflictoError } from "../../../../domain/errors.js";
import { Correo } from "../../../../domain/value-objects/correo.js";

export interface FilaUsuario {
  id: string;
  correo: string;
  clave_hash: string;
}

export interface FilaEmpresa {
  id: string;
  nombre: string;
  pais: string;
  usuario_id: string | null;
}

export type FilaEmpresaConUsuario = Omit<FilaEmpresa, "usuario_id"> & {
  usuario: FilaUsuario | null;
};

export const COLUMNAS_USUARIO = "id, correo, clave_hash";
export const COLUMNAS_EMPRESA_CON_USUARIO = `id, nombre, pais, usuario:usuarios(${COLUMNAS_USUARIO})`;

export const usuarioAFila = (usuario: Usuario): FilaUsuario => ({
  id: usuario.id,
  correo: usuario.correo.valor,
  clave_hash: usuario.clave,
});

export const filaAUsuario = (fila: FilaUsuario): Usuario =>
  Usuario.crear({
    id: fila.id,
    correo: Correo.crear(fila.correo),
    clave: fila.clave_hash,
  });

export const empresaAFila = (empresa: Empresa): FilaEmpresa => ({
  id: empresa.id,
  nombre: empresa.nombre,
  pais: empresa.pais,
  usuario_id: empresa.usuario?.id ?? null,
});

export const filaAEmpresa = (fila: FilaEmpresaConUsuario): Empresa =>
  Empresa.crear({
    id: fila.id,
    nombre: fila.nombre,
    pais: fila.pais,
    usuario: fila.usuario ? filaAUsuario(fila.usuario) : null,
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
