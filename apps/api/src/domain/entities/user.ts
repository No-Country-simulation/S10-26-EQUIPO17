import { ValidacionError } from "../errors.js";
import { textoRequerido } from "../validaciones.js";
import type { Email } from "../value-objects/email.js";

export const MIN_PASSWORD_LENGTH = 8;

/** Credentials live in the auth provider, so the entity never holds a password. */
export interface UserProps {
  id: string;
  email: Email;
}

export class User {
  private constructor(
    readonly id: string,
    readonly email: Email,
  ) {}

  static create(props: UserProps): User {
    return new User(textoRequerido(props.id, "id"), props.email);
  }

  /** Business rule on the chosen password, before handing it to the auth provider. */
  static validatePlainPassword(plainPassword: string): void {
    if (plainPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ValidacionError(
        `The password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      );
    }
  }
}
