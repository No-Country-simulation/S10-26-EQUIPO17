import { ValidacionError } from "../errors.js";

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email address normalized (trimmed, lowercased) and with a valid format. */
export class Email {
  private constructor(readonly value: string) {}

  static create(value: string): Email {
    const normalized = value.trim().toLowerCase();
    if (!EMAIL_FORMAT.test(normalized)) {
      throw new ValidacionError("The email does not have a valid format");
    }
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
