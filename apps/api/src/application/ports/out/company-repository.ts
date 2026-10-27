import type { Company } from "../../../domain/entities/company.js";

export interface CompanyRepository {
  save(company: Company): Promise<void>;
  findById(id: string): Promise<Company | null>;
}
