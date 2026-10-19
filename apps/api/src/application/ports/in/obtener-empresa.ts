import type { Empresa } from "../../../domain/entities/empresa.js";

export interface ObtenerEmpresa {
  ejecutar(id: string): Promise<Empresa>;
}
