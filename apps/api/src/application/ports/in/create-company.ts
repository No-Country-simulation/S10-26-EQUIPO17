import type { Company } from "../../../domain/entities/company.js";

export interface CreateCompanyData {
  firstName: string;
  lastName: string;
  jobPosition: string;
  companyName: string;
  country: string;
  businessSector: string;
  interests: string[];
  /** User that owns the company; optional. */
  userId?: string | null;
}

export interface CreateCompany {
  execute(data: CreateCompanyData): Promise<Company>;
}
