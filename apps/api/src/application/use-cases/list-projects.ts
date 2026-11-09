import { AccesoDenegadoError } from "../../domain/errors.js";
import type { ListProjects } from "../ports/in/list-projects.js";
import type { AuthenticatedUser } from "../ports/out/auth-provider.js";
import type { CompanyRepository } from "../ports/out/company-repository.js";
import type { ProjectRepository } from "../ports/out/project-repository.js";

export class ListProjectsUseCase implements ListProjects {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(user: AuthenticatedUser) {
    if (user.role !== "company") {
      throw new AccesoDenegadoError("Only companies can list projects");
    }

    const company = await this.companies.findByUserId(user.userId);

    if (!company) {
      throw new AccesoDenegadoError("You must be a company to list a project");
    }
    return this.projects.findByCompanyId(company.id);
  }
}
