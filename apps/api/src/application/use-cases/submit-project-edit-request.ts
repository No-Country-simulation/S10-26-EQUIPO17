import { Project } from "../../domain/entities/project.js";
import { ProjectEditRequest } from "../../domain/entities/project-edit-request.js";

import {
  AccesoDenegadoError,
  ConflictoError,
  NoEncontradoError,
  ValidacionError,
} from "../../domain/errors.js";

import { BusinessSector } from "../../domain/value-objects/business-sector.js";
import { ProjectStage } from "../../domain/value-objects/project-stage.js";
import { Vertical } from "../../domain/value-objects/vertical.js";

import type {
  SubmitProjectEditRequest,
  SubmitProjectEditRequestData,
} from "../ports/in/submit-project-edit-request.js";

import type { AuthenticatedUser } from "../ports/out/auth-provider.js";
import type { CompanyRepository } from "../ports/out/company-repository.js";
import type { GeneradorDeIds } from "../ports/out/generador-de-ids.js";
import type { ProjectRepository } from "../ports/out/project-repository.js";
import type { ProjectEditRequestRepository } from "../ports/out/project-edit-request-repository.js";

export class SubmitProjectEditRequestUseCase implements SubmitProjectEditRequest {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly projects: ProjectRepository,
    private readonly editRequests: ProjectEditRequestRepository,
    private readonly ids: GeneradorDeIds,
  ) {}
  async execute(
    user: AuthenticatedUser,
    projectId: string,
    data: SubmitProjectEditRequestData,
  ): Promise<ProjectEditRequest> {
    if (user.role !== "company") {
      throw new AccesoDenegadoError("Only companies can request project edits");
    }
    const company = await this.companies.findByUserId(user.userId);
    if (!company) {
      throw new AccesoDenegadoError("Only companies can request project edits");
    }
    const project = await this.projects.findById(projectId);

    if (!project || project.companyId !== company.id) {
      throw new NoEncontradoError("Project not found");
    }
    const hasChanges =
      data.title !== undefined ||
      data.description !== undefined ||
      data.vertical !== undefined ||
      data.businessSectors !== undefined ||
      data.projectStage !== undefined;

    if (!hasChanges) {
      throw new ValidacionError("At least one project field must be provided");
    }
    const existingRequest = await this.editRequests.findPendingByProjectId(
      project.id,
    );

    if (existingRequest) {
      throw new ConflictoError(
        "A pending edit request already exists for this project",
      );
    }
    const proposedProject = Project.create({
      id: project.id,
      companyId: project.companyId,
      title: data.title ?? project.title,
      description: data.description ?? project.description,
      vertical:
        data.vertical === undefined
          ? project.vertical
          : new Vertical(data.vertical),
      businessSectors:
        data.businessSectors === undefined
          ? [...project.businessSectors]
          : data.businessSectors.map((sector) => new BusinessSector(sector)),
      projectStage:
        data.projectStage === undefined
          ? project.projectStage
          : new ProjectStage(data.projectStage),
    });
    const request = ProjectEditRequest.create({
      id: this.ids.generar(),
      proposedProject,
      requestedByUserId: user.userId,
    });
    await this.editRequests.save(request);

    return request;
  }
}
