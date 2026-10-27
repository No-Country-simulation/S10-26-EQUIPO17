import { Company } from "../../domain/entities/company.js";
import type { User } from "../../domain/entities/user.js";
import { NoEncontradoError } from "../../domain/errors.js";
import type { CreateCompany, CreateCompanyData } from "../ports/in/create-company.js";
import type { CompanyRepository } from "../ports/out/company-repository.js";
import type { GeneradorDeIds } from "../ports/out/generador-de-ids.js";
import type { UserRepository } from "../ports/out/user-repository.js";

export class CreateCompanyUseCase implements CreateCompany {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly users: UserRepository,
    private readonly ids: GeneradorDeIds,
  ) {}

  async execute(data: CreateCompanyData): Promise<Company> {
    let user: User | null = null;
    if (data.userId) {
      user = await this.users.findById(data.userId);
      if (!user) {
        throw new NoEncontradoError(`User ${data.userId} does not exist`);
      }
    }

    const company = Company.create({
      id: this.ids.generar(),
      firstName: data.firstName,
      lastName: data.lastName,
      jobPosition: data.jobPosition,
      companyName: data.companyName,
      user,
    });
    await this.companies.save(company);
    return company;
  }
}
