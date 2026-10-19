import type { Empresa } from "../../../domain/entities/empresa.js";

export interface RepositorioDeEmpresas {
  guardar(empresa: Empresa): Promise<void>;
  buscarPorId(id: string): Promise<Empresa | null>;
}
