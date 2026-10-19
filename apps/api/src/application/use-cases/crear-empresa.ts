import { Empresa } from "../../domain/entities/empresa.js";
import type { Usuario } from "../../domain/entities/usuario.js";
import { NoEncontradoError } from "../../domain/errors.js";
import type { CrearEmpresa, CrearEmpresaDatos } from "../ports/in/crear-empresa.js";
import type { GeneradorDeIds } from "../ports/out/generador-de-ids.js";
import type { RepositorioDeEmpresas } from "../ports/out/repositorio-de-empresas.js";
import type { RepositorioDeUsuarios } from "../ports/out/repositorio-de-usuarios.js";

export class CrearEmpresaCasoDeUso implements CrearEmpresa {
  constructor(
    private readonly empresas: RepositorioDeEmpresas,
    private readonly usuarios: RepositorioDeUsuarios,
    private readonly ids: GeneradorDeIds,
  ) {}

  async ejecutar(datos: CrearEmpresaDatos): Promise<Empresa> {
    let usuario: Usuario | null = null;
    if (datos.usuarioId) {
      usuario = await this.usuarios.buscarPorId(datos.usuarioId);
      if (!usuario) {
        throw new NoEncontradoError(`No existe el usuario ${datos.usuarioId}`);
      }
    }

    const empresa = Empresa.crear({
      id: this.ids.generar(),
      nombre: datos.nombre,
      pais: datos.pais,
      usuario,
    });
    await this.empresas.guardar(empresa);
    return empresa;
  }
}
