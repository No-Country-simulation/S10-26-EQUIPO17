import { ValidacionError } from "../errors.js";

enum EnumCountry {
  ARGENTINA = "Argentina",
  BRAZIL = "Brazil",
  CHILE = "Chile",
  USA = "USA",
  CANADA = "Canada",
}

class Country {
  private readonly country: EnumCountry;

  constructor(country: string) {
    if (!Country.isValidCountry(country)) {
      throw new ValidacionError(`Invalid country: ${country}`);
    }
    this.country = country as EnumCountry;
  }

  public getCountry(): EnumCountry {
    return this.country;
  }

  private static isValidCountry(country: string): boolean {
    return Object.values(EnumCountry).includes(country as EnumCountry);
  }
}

export { Country };
