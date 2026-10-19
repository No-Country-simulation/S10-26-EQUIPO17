import type { RepositorioDeEmpresas } from "../../../../application/ports/out/repositorio-de-empresas.js";
import type { Empresa } from "../../../../domain/entities/empresa.js";

/** Implementación en memoria del puerto. Sirve para tests y para desarrollar sin base de datos. */
export class RepositorioDeEmpresasEnMemoria implements RepositorioDeEmpresas {
  private readonly empresas = new Map<string, Empresa>();

  async guardar(empresa: Empresa): Promise<void> {
    this.empresas.set(empresa.id, empresa);
  }

  async buscarPorId(id: string): Promise<Empresa | null> {
    return this.empresas.get(id) ?? null;
  }
}
