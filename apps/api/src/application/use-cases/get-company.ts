import type { Company } from "../../domain/entities/company.js";
import { NoEncontradoError } from "../../domain/errors.js";
import type { GetCompany } from "../ports/in/get-company.js";
import type { CompanyRepository } from "../ports/out/company-repository.js";

export class GetCompanyUseCase implements GetCompany {
  constructor(private readonly companies: CompanyRepository) {}

  async execute(id: string): Promise<Company> {
    const company = await this.companies.findById(id);
    if (!company) {
      throw new NoEncontradoError(`Company ${id} does not exist`);
    }
    return company;
  }
}
