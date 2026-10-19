import type { Empresa } from "../../../domain/entities/empresa.js";
import type { Usuario } from "../../../domain/entities/usuario.js";

// DTOs de salida. La clave (aunque esté hasheada) nunca sale de la API.
export interface UsuarioRespuesta {
  id: string;
  correo: string;
}

export interface EmpresaRespuesta {
  id: string;
  nombre: string;
  pais: string;
  usuario: UsuarioRespuesta | null;
}

export const usuarioARespuesta = (usuario: Usuario): UsuarioRespuesta => ({
  id: usuario.id,
  correo: usuario.correo.valor,
});

export const empresaARespuesta = (empresa: Empresa): EmpresaRespuesta => ({
  id: empresa.id,
  nombre: empresa.nombre,
  pais: empresa.pais,
  usuario: empresa.usuario ? usuarioARespuesta(empresa.usuario) : null,
});
