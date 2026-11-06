import { Project } from "../../domain/entities/project.js";
import { AccesoDenegadoError } from "../../domain/errors.js";
import { BusinessSector } from "../../domain/value-objects/business-sector.js";
import { ProjectStage } from "../../domain/value-objects/project-stage.js";
import { Vertical } from "../../domain/value-objects/vertical.js";
import type { UploadProject, UploadProjectData } from "../ports/in/upload-project.js";
import type { AuthenticatedUser } from "../ports/out/auth-provider.js";
import type { CompanyRepository } from "../ports/out/company-repository.js";
import type { GeneradorDeIds } from "../ports/out/generador-de-ids.js";
import type { ProjectRepository } from "../ports/out/project-repository.js";

export class UploadProjectUseCase implements UploadProject {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly projects: ProjectRepository,
    private readonly ids: GeneradorDeIds,
  ) {}

  async execute(user: AuthenticatedUser, data: UploadProjectData): Promise<Project> {
    if (user.role !== "company") {
      throw new AccesoDenegadoError("Only companies can upload projects");
    }
    // The owner comes from the session, never from the request: nobody can publish for another company.
    const company = await this.companies.findByUserId(user.userId);
    if (!company) {
      throw new AccesoDenegadoError("Only companies can upload projects");
    }

    const project = Project.create({
      id: this.ids.generar(),
      companyId: company.id,
      title: data.title,
      description: data.description,
      vertical: new Vertical(data.vertical),
      businessSectors: data.businessSectors.map((sector) => new BusinessSector(sector)),
      projectStage: new ProjectStage(data.projectStage),
    });
    await this.projects.save(project);
    return project;
  }
}
