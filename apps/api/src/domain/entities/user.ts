import { ValidacionError } from "../errors.js";
import { textoRequerido } from "../validaciones.js";
import type { Email } from "../value-objects/email.js";

export const MIN_PASSWORD_LENGTH = 8;

export interface UserProps {
  id: string;
  email: Email;
  /** Password hash. The plain-text password is never stored in the entity. */
  passwordHash: string;
}

export class User {
  private constructor(
    readonly id: string,
    readonly email: Email,
    readonly passwordHash: string,
  ) {}

  static create(props: UserProps): User {
    return new User(
      textoRequerido(props.id, "id"),
      props.email,
      textoRequerido(props.passwordHash, "passwordHash"),
    );
  }

  /** Business rule on the chosen password, before hashing it. */
  static validatePlainPassword(plainPassword: string): void {
    if (plainPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ValidacionError(
        `The password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      );
    }
  }
}
