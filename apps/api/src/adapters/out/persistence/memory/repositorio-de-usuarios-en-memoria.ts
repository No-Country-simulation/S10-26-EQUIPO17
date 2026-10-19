import type { RepositorioDeUsuarios } from "../../../../application/ports/out/repositorio-de-usuarios.js";
import type { Usuario } from "../../../../domain/entities/usuario.js";
import type { Correo } from "../../../../domain/value-objects/correo.js";

/** Implementación en memoria del puerto. Sirve para tests y para desarrollar sin base de datos. */
export class RepositorioDeUsuariosEnMemoria implements RepositorioDeUsuarios {
  private readonly usuarios = new Map<string, Usuario>();

  async guardar(usuario: Usuario): Promise<void> {
    this.usuarios.set(usuario.id, usuario);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuarios.get(id) ?? null;
  }

  async buscarPorCorreo(correo: Correo): Promise<Usuario | null> {
    for (const usuario of this.usuarios.values()) {
      if (usuario.correo.equals(correo)) return usuario;
    }
    return null;
  }
}
