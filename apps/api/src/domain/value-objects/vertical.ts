import { ValidacionError } from "../errors.js";

// TODO: Cambiar las verticales de ejemplo por las verticales reales que se van a utilizar en la aplicación
// Estas son verticales de ejemplo
enum EnumVertical {
  vertical1 = "E-commerce",
  vertical2 = "Fintech",
  vertical3 = "Healthtech",
  vertical4 = "Edtech",
  vertical5 = "Logistics",
}

class Vertical {
  private readonly vertical: EnumVertical;

  constructor(vertical: string) {
    if (!Vertical.isValidVertical(vertical)) {
      throw new ValidacionError(`Invalid vertical: ${vertical}`);
    }
    this.vertical = vertical as EnumVertical;
  }

  public getVertical(): EnumVertical {
    return this.vertical;
  }

  private static isValidVertical(vertical: string): boolean {
    return Object.values(EnumVertical).includes(vertical as EnumVertical);
  }
}

export { Vertical };
