import type { Empresa } from "../../../domain/entities/empresa.js";
import type { User } from "../../../domain/entities/user.js";

// DTOs de salida. El password (aunque esté hasheado) nunca sale de la API.
export interface UserResponse {
  id: string;
  email: string;
}

export interface EmpresaRespuesta {
  id: string;
  nombre: string;
  pais: string;
  user: UserResponse | null;
}

export const userToResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email.value,
});

export const empresaARespuesta = (empresa: Empresa): EmpresaRespuesta => ({
  id: empresa.id,
  nombre: empresa.nombre,
  pais: empresa.pais,
  user: empresa.user ? userToResponse(empresa.user) : null,
});
