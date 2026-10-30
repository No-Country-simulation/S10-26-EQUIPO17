import { ValidacionError } from "../errors.js";

enum EnumBusinessSector {
  product = "Product",
  it = "IT",
  marketing = "Marketing",
  softwareDevelopment = "Software Development",
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
