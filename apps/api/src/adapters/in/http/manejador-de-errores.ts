import type { ErrorRequestHandler } from "express";
import {
  ConflictoError,
  CredencialesInvalidasError,
  DomainError,
  NoEncontradoError,
  ValidacionError,
} from "../../../domain/errors.js";

function estadoDeError(error: DomainError): number {
  if (error instanceof ValidacionError) return 400;
  if (error instanceof CredencialesInvalidasError) return 401;
  if (error instanceof NoEncontradoError) return 404;
  if (error instanceof ConflictoError) return 409;
  return 422;
}

/** Errores de Express/body-parser pensados para el cliente (p. ej. JSON mal formado). */
function esErrorHttpPublico(error: unknown): error is { status: number; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    "expose" in error &&
    error.expose === true
  );
}

export const manejadorDeErrores: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof DomainError) {
    res.status(estadoDeError(error)).json({ error: error.message });
    return;
  }
  if (esErrorHttpPublico(error)) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Error interno del servidor" });
};
