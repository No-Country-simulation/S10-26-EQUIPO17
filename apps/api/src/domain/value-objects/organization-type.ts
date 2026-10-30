import { ValidacionError } from "../errors.js";

enum EnumOrganizationType {
  startUp = "StartUp",
  educationalInstitute = "Educational Institute",
  company = "Company",
}

class OrganizationType {
  private readonly type: EnumOrganizationType;

  constructor(type: string) {
    if (!OrganizationType.isValidType(type)) {
      throw new ValidacionError(`Invalid organization type: ${type}`);
    }
    this.type = type as EnumOrganizationType;
  }

  public getType(): EnumOrganizationType {
    return this.type;
  }

  private static isValidType(type: string): boolean {
    return Object.values(EnumOrganizationType).includes(
      type as EnumOrganizationType,
    );
  }
}

export { OrganizationType };
