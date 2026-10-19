import { textoRequerido } from "../validaciones.js";
import type { Usuario } from "./usuario.js";

export interface EmpresaProps {
  id: string;
  nombre: string;
  pais: string;
  usuario?: Usuario | null;
}

export class Empresa {
  private constructor(
    readonly id: string,
    readonly nombre: string,
    readonly pais: string,
    readonly usuario: Usuario | null,
  ) {}

  static crear(props: EmpresaProps): Empresa {
    return new Empresa(
      textoRequerido(props.id, "id"),
      textoRequerido(props.nombre, "nombre"),
      textoRequerido(props.pais, "pais"),
      props.usuario ?? null,
    );
  }
}
