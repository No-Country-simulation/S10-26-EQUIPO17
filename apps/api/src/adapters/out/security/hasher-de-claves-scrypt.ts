import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import type { HasherDeClaves } from "../../../application/ports/out/hasher-de-claves.js";

const scryptAsync = promisify(scrypt) as (
  clave: string,
  salt: Buffer,
  longitud: number,
) => Promise<Buffer>;

const LONGITUD_SALT = 16;
const LONGITUD_HASH = 64;

/** Hashea con scrypt (node:crypto). Formato guardado: `scrypt$<salt hex>$<hash hex>`. */
export class HasherDeClavesScrypt implements HasherDeClaves {
  async hashear(clavePlana: string): Promise<string> {
    const salt = randomBytes(LONGITUD_SALT);
    const hash = await scryptAsync(clavePlana, salt, LONGITUD_HASH);
    return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
  }
}
