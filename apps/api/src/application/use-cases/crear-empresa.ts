import { Empresa } from "../../domain/entities/empresa.js";
import type { User } from "../../domain/entities/user.js";
import { NoEncontradoError } from "../../domain/errors.js";
import type { CrearEmpresa, CrearEmpresaDatos } from "../ports/in/crear-empresa.js";
import type { GeneradorDeIds } from "../ports/out/generador-de-ids.js";
import type { RepositorioDeEmpresas } from "../ports/out/repositorio-de-empresas.js";
import type { UserRepository } from "../ports/out/user-repository.js";

export class CrearEmpresaCasoDeUso implements CrearEmpresa {
  constructor(
    private readonly empresas: RepositorioDeEmpresas,
    private readonly users: UserRepository,
    private readonly ids: GeneradorDeIds,
  ) {}

  async ejecutar(datos: CrearEmpresaDatos): Promise<Empresa> {
    let user: User | null = null;
    if (datos.userId) {
      user = await this.users.findById(datos.userId);
      if (!user) {
        throw new NoEncontradoError(`No existe el usuario ${datos.userId}`);
      }
    }

    const empresa = Empresa.crear({
      id: this.ids.generar(),
      nombre: datos.nombre,
      pais: datos.pais,
      user,
    });
    await this.empresas.guardar(empresa);
    return empresa;
  }
}
