// Errores de negocio. No saben nada de HTTP: el adaptador de entrada decide
// cómo traducirlos (p. ej. a códigos de estado).
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Un dato no cumple las reglas del dominio. */
export class ValidacionError extends DomainError {}

/** Se pidió algo que no existe. */
export class NoEncontradoError extends DomainError {}

/** La operación choca con el estado actual (p. ej. un email ya registrado). */
export class ConflictoError extends DomainError {}
