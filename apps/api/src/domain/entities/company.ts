import { textoRequerido } from "../validaciones.js";
import type { User } from "./user.js";
import { Country } from "../value-objects/country.js";
import { BusinessSector } from "../value-objects/business-sector.js";
import { OrganizationType } from "../value-objects/organization-type.js";

export interface CompanyProps {
  id: string;
  firstName: string;
  lastName: string;
  jobPosition: string;
  companyName: string;
  country: Country;
  businessSector: BusinessSector;
  organizationType: OrganizationType;
  user?: User | null;
}

export class Company {
  private constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly jobPosition: string,
    readonly companyName: string,
    readonly country: Country,
    readonly businessSector: BusinessSector,
    readonly organizationType: OrganizationType,
    readonly user: User | null,
  ) {}

  static create(props: CompanyProps): Company {
    return new Company(
      textoRequerido(props.id, "id"),
      textoRequerido(props.firstName, "firstName"),
      textoRequerido(props.lastName, "lastName"),
      textoRequerido(props.jobPosition, "jobPosition"),
      textoRequerido(props.companyName, "companyName"),
      props.country,
      props.businessSector,
      props.organizationType,
      props.user ?? null,
    );
  }
}
