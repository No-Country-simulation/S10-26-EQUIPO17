import type { Empresa } from "../../../domain/entities/empresa.js";

export interface CrearEmpresaDatos {
  nombre: string;
  pais: string;
  /** User dueño de la empresa; opcional. */
  userId?: string | null;
}

export interface CrearEmpresa {
  ejecutar(datos: CrearEmpresaDatos): Promise<Empresa>;
}
