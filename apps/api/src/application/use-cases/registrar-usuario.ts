import { Usuario } from "../../domain/entities/usuario.js";
import { ConflictoError } from "../../domain/errors.js";
import { Correo } from "../../domain/value-objects/correo.js";
import type {
  RegistrarUsuario,
  RegistrarUsuarioDatos,
} from "../ports/in/registrar-usuario.js";
import type { GeneradorDeIds } from "../ports/out/generador-de-ids.js";
import type { HasherDeClaves } from "../ports/out/hasher-de-claves.js";
import type { RepositorioDeUsuarios } from "../ports/out/repositorio-de-usuarios.js";

export class RegistrarUsuarioCasoDeUso implements RegistrarUsuario {
  constructor(
    private readonly usuarios: RepositorioDeUsuarios,
    private readonly hasher: HasherDeClaves,
    private readonly ids: GeneradorDeIds,
  ) {}

  async ejecutar(datos: RegistrarUsuarioDatos): Promise<Usuario> {
    const correo = Correo.crear(datos.correo);
    Usuario.validarClavePlana(datos.clave);

    if (await this.usuarios.buscarPorCorreo(correo)) {
      throw new ConflictoError("Ya existe un usuario con ese correo");
    }

    const usuario = Usuario.crear({
      id: this.ids.generar(),
      correo,
      clave: await this.hasher.hashear(datos.clave),
    });
    await this.usuarios.guardar(usuario);
    return usuario;
  }
}
