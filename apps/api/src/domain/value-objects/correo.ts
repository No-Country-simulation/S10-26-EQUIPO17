import { ValidacionError } from "../errors.js";

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Correo electrónico normalizado (sin espacios, en minúsculas) y con formato válido. */
export class Correo {
  private constructor(readonly valor: string) {}

  static crear(valor: string): Correo {
    const normalizado = valor.trim().toLowerCase();
    if (!FORMATO_CORREO.test(normalizado)) {
      throw new ValidacionError("El correo no tiene un formato válido");
    }
    return new Correo(normalizado);
  }

  equals(otro: Correo): boolean {
    return this.valor === otro.valor;
  }
}
