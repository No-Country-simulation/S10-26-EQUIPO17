import type { Usuario } from "../../../domain/entities/usuario.js";

export interface RegistrarUsuarioDatos {
  correo: string;
  clave: string;
}

export interface RegistrarUsuario {
  ejecutar(datos: RegistrarUsuarioDatos): Promise<Usuario>;
}
