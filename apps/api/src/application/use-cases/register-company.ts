import { Company, type CompanyProps } from "../../domain/entities/company.js";
import { User } from "../../domain/entities/user.js";
import { BusinessSector } from "../../domain/value-objects/business-sector.js";
import { Country } from "../../domain/value-objects/country.js";
import { Email } from "../../domain/value-objects/email.js";
import { ExplorationInterest } from "../../domain/value-objects/exploration-interest.js";
import type { RegisterCompany, RegisterCompanyData } from "../ports/in/register-company.js";
import type { AuthProvider } from "../ports/out/auth-provider.js";
import type { CompanyRepository } from "../ports/out/company-repository.js";
import type { GeneradorDeIds } from "../ports/out/generador-de-ids.js";

export class RegisterCompanyUseCase implements RegisterCompany {
  constructor(
    private readonly auth: AuthProvider,
    private readonly companies: CompanyRepository,
    private readonly ids: GeneradorDeIds,
  ) {}

  async execute(data: RegisterCompanyData): Promise<Company> {
    const email = Email.create(data.email);
    User.validatePlainPassword(data.password);

    const props: CompanyProps = {
      id: this.ids.generar(),
      firstName: data.firstName,
      lastName: data.lastName,
      jobPosition: data.jobPosition,
      companyName: data.companyName,
      country: new Country(data.country),
      businessSector: new BusinessSector(data.businessSector),
      interests: new ExplorationInterest(data.interests),
    };
    // Validate the whole company before creating the user, so invalid data never leaves one behind.
    Company.create(props);

    const userId = await this.auth.register(email, data.password, "company");
    try {
      const company = Company.create({ ...props, user: User.create({ id: userId, email }) });
      await this.companies.save(company);
      return company;
    } catch (error) {
      // Without its company the user would have no role, so the registration is undone.
      await this.auth.remove(userId).catch((removeError: unknown) => {
        throw new AggregateError(
          [error, removeError],
          `Company registration failed and user ${userId} could not be removed`,
        );
      });
      throw error;
    }
  }
}
