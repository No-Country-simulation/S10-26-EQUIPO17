import type { SupabaseClient } from "@supabase/supabase-js";
import type { RepositorioDeUsuarios } from "../../../../application/ports/out/repositorio-de-usuarios.js";
import type { Usuario } from "../../../../domain/entities/usuario.js";
import type { Correo } from "../../../../domain/value-objects/correo.js";
import {
  COLUMNAS_USUARIO,
  filaAUsuario,
  TEXTO_NO_ES_UUID,
  traducirError,
  usuarioAFila,
  type FilaUsuario,
} from "./filas.js";

export class RepositorioDeUsuariosSupabase implements RepositorioDeUsuarios {
  constructor(private readonly supabase: SupabaseClient) {}

  async guardar(usuario: Usuario): Promise<void> {
    const { error } = await this.supabase
      .from("usuarios")
      .upsert(usuarioAFila(usuario));
    if (error) throw traducirError(error);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const { data, error } = await this.supabase
      .from("usuarios")
      .select(COLUMNAS_USUARIO)
      .eq("id", id)
      .maybeSingle<FilaUsuario>();
    // Un id que no es UUID no puede existir en la tabla.
    if (error?.code === TEXTO_NO_ES_UUID) return null;
    if (error) throw traducirError(error);
    return data ? filaAUsuario(data) : null;
  }

  async buscarPorCorreo(correo: Correo): Promise<Usuario | null> {
    const { data, error } = await this.supabase
      .from("usuarios")
      .select(COLUMNAS_USUARIO)
      .eq("correo", correo.valor)
      .maybeSingle<FilaUsuario>();
    if (error) throw traducirError(error);
    return data ? filaAUsuario(data) : null;
  }
}
