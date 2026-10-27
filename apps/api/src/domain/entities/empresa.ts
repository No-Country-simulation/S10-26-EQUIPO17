import { textoRequerido } from "../validaciones.js";
import type { User } from "./user.js";

export interface EmpresaProps {
  id: string;
  nombre: string;
  pais: string;
  user?: User | null;
}

export class Empresa {
  private constructor(
    readonly id: string,
    readonly nombre: string,
    readonly pais: string,
    readonly user: User | null,
  ) {}

  static crear(props: EmpresaProps): Empresa {
    return new Empresa(
      textoRequerido(props.id, "id"),
      textoRequerido(props.nombre, "nombre"),
      textoRequerido(props.pais, "pais"),
      props.user ?? null,
    );
  }
}
