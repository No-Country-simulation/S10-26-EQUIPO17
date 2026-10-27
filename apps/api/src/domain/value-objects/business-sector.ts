import { ValidacionError } from "../errors.js";

// TODO: Cambiar los sectores de ejemplo por los sectores reales que se van a utilizar en la aplicación
// Estos son sectores de ejemplo
enum EnumBusinessSector {
  sector1 = "Technology",
  sector2 = "Healthcare",
  sector3 = "Finance",
  sector4 = "Education",
  sector5 = "Manufacturing",
}

class BusinessSector {
  private readonly sector: EnumBusinessSector;

  constructor(sector: string) {
    if (!BusinessSector.isValidSector(sector)) {
      throw new ValidacionError(`Invalid business sector: ${sector}`);
    }
    this.sector = sector as EnumBusinessSector;
  }

  public getSector(): EnumBusinessSector {
    return this.sector;
  }

  private static isValidSector(sector: string): boolean {
    return Object.values(EnumBusinessSector).includes(
      sector as EnumBusinessSector,
    );
  }
}

export { BusinessSector };
