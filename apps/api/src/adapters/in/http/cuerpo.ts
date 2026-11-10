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

export function leerTextos(cuerpo: Cuerpo, campo: string): string[] {
  const valor = cuerpo[campo];
  if (
    !Array.isArray(valor) ||
    !valor.every((item) => typeof item === "string")
  ) {
    throw new ValidacionError(
      `El campo "${campo}" debe ser una lista de textos`,
    );
  }
  return valor;
}

// importante para verificar que los campos del texto opcional sean validos
export function leerTextoOpcional(
  cuerpo: Cuerpo,
  campo: string,
): string | undefined {
  const valor = cuerpo[campo];

  if (valor === undefined) return undefined;

  if (typeof valor !== "string") {
    throw new ValidacionError(`El campo "${campo}" debe ser un texto`);
  }

  return valor;
}

export function leerTextosOpcional(
  cuerpo: Cuerpo,
  campo: string,
): string[] | undefined {
  const valor = cuerpo[campo];

  if (valor === undefined) return undefined;

  if (
    !Array.isArray(valor) ||
    !valor.every((item) => typeof item === "string")
  ) {
    throw new ValidacionError(
      `El campo "${campo}" debe ser una lista de textos`,
    );
  }

  return valor;
}
//verifica que el parametro no este vacio
export function leerParametroRuta(valor: unknown, nombre: string): string {
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new ValidacionError(`El parámetro "${nombre}" debe ser un texto`);
  }

  return valor;
}
