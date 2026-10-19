import { ValidacionError } from "./errors.js";

export function textoRequerido(valor: string, campo: string): string {
  const limpio = valor.trim();
  if (limpio === "") {
    throw new ValidacionError(`El campo "${campo}" es obligatorio`);
  }
  return limpio;
}
