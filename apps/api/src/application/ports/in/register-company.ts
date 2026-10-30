import type { Company } from "../../../domain/entities/company.js";

export interface RegisterCompanyData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  jobPosition: string;
  companyName: string;
  country: string;
  businessSector: string;
  organizationType: string;
}

/** Signs up a company: creates its user (with the company role) and the company itself. */
export interface RegisterCompany {
  execute(data: RegisterCompanyData): Promise<Company>;
}
