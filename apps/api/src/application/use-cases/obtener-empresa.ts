import type { Empresa } from "../../domain/entities/empresa.js";
import { NoEncontradoError } from "../../domain/errors.js";
import type { ObtenerEmpresa } from "../ports/in/obtener-empresa.js";
import type { RepositorioDeEmpresas } from "../ports/out/repositorio-de-empresas.js";

export class ObtenerEmpresaCasoDeUso implements ObtenerEmpresa {
  constructor(private readonly empresas: RepositorioDeEmpresas) {}

  async ejecutar(id: string): Promise<Empresa> {
    const empresa = await this.empresas.buscarPorId(id);
    if (!empresa) {
      throw new NoEncontradoError(`No existe la empresa ${id}`);
    }
    return empresa;
  }
}
