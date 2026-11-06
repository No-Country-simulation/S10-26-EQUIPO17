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

/**
 * Email o contraseña incorrectos. Un único mensaje para ambos casos,
 * así no se revela si el email está registrado.
 */
export class CredencialesInvalidasError extends DomainError {
  constructor() {
    super("Invalid email or password");
  }
}

/** No hay una sesión válida: el token falta, expiró o no es auténtico. */
export class NoAutenticadoError extends DomainError {
  constructor() {
    super("Authentication required");
  }
}

/** Se sabe quién es el usuario, pero no tiene permitida la operación. */
export class AccesoDenegadoError extends DomainError {}
