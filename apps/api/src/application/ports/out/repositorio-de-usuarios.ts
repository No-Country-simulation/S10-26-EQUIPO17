import type { Usuario } from "../../../domain/entities/usuario.js";
import type { Correo } from "../../../domain/value-objects/correo.js";

export interface RepositorioDeUsuarios {
  guardar(usuario: Usuario): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorCorreo(correo: Correo): Promise<Usuario | null>;
}
