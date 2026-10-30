import { ValidacionError } from "../../../domain/errors.js";

// Lectura defensiva del body: el adaptador solo garantiza los tipos;
// las reglas de negocio (vacíos, formatos) las aplica el dominio.
type Cuerpo = Record<string, unknown>;

export function leerCuerpo(body: unknown): Cuerpo {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidacionError("El cuerpo debe ser un objeto JSON");
  }
  return body as Cuerpo;
}

export function leerTexto(cuerpo: Cuerpo, campo: string): string {
  const valor = cuerpo[campo];
  if (typeof valor !== "string") {
    throw new ValidacionError(`El campo "${campo}" debe ser un texto`);
  }
  return valor;
}
