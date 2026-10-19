import type { Empresa } from "../../../domain/entities/empresa.js";

export interface CrearEmpresaDatos {
  nombre: string;
  pais: string;
  /** Usuario dueño de la empresa; opcional. */
  usuarioId?: string | null;
}

export interface CrearEmpresa {
  ejecutar(datos: CrearEmpresaDatos): Promise<Empresa>;
}
