import type { CompanyRepository } from "../../../../application/ports/out/company-repository.js";
import type { Company } from "../../../../domain/entities/company.js";

/** In-memory implementation of the port. Used by tests and to develop without a database. */
export class InMemoryCompanyRepository implements CompanyRepository {
  private readonly companies = new Map<string, Company>();

  async save(company: Company): Promise<void> {
    this.companies.set(company.id, company);
  }

  async findById(id: string): Promise<Company | null> {
    return this.companies.get(id) ?? null;
  }
}
