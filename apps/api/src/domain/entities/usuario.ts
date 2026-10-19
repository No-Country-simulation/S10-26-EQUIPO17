import { ValidacionError } from "../errors.js";
import { textoRequerido } from "../validaciones.js";
import type { Correo } from "../value-objects/correo.js";

export const LONGITUD_MINIMA_CLAVE = 8;

export interface UsuarioProps {
  id: string;
  correo: Correo;
  /** Hash de la clave. La clave en texto plano nunca se guarda en la entidad. */
  clave: string;
}

export class Usuario {
  private constructor(
    readonly id: string,
    readonly correo: Correo,
    readonly clave: string,
  ) {}

  static crear(props: UsuarioProps): Usuario {
    return new Usuario(
      textoRequerido(props.id, "id"),
      props.correo,
      textoRequerido(props.clave, "clave"),
    );
  }

  /** Regla de negocio sobre la clave elegida, antes de hashearla. */
  static validarClavePlana(clavePlana: string): void {
    if (clavePlana.length < LONGITUD_MINIMA_CLAVE) {
      throw new ValidacionError(
        `La clave debe tener al menos ${LONGITUD_MINIMA_CLAVE} caracteres`,
      );
    }
  }
}
