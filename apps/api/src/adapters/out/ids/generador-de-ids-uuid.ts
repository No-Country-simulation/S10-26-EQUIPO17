import { randomUUID } from "node:crypto";
import type { GeneradorDeIds } from "../../../application/ports/out/generador-de-ids.js";

export class GeneradorDeIdsUuid implements GeneradorDeIds {
  generar(): string {
    return randomUUID();
  }
}
