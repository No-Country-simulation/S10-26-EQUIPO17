import type { Company } from "../../../domain/entities/company.js";
import type { Project } from "../../../domain/entities/project.js";
import type { Session } from "../../../application/ports/in/log-in.js";
import type { User } from "../../../domain/entities/user.js";
import type { UserRole } from "../../../domain/value-objects/user-role.js";
import type { ProjectEditRequest } from "../../../domain/entities/project-edit-request.js";

// DTOs de salida. El password (aunque esté hasheado) nunca sale de la API.
export interface UserResponse {
  id: string;
  email: string;
}

export interface CompanyResponse {
  id: string;
  firstName: string;
  lastName: string;
  jobPosition: string;
  companyName: string;
  country: string;
  businessSector: string;
  organizationType: string;
  user: UserResponse | null;
}

export const userToResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email.value,
});

/** Tokens are left out on purpose: they only travel in HttpOnly cookies. */
export interface SessionResponse {
  user: UserResponse & { role: UserRole | null };
}

export const sessionToResponse = (session: Session): SessionResponse => ({
  user: { ...userToResponse(session.user), role: session.role },
});

export const companyToResponse = (company: Company): CompanyResponse => ({
  id: company.id,
  firstName: company.firstName,
  lastName: company.lastName,
  jobPosition: company.jobPosition,
  companyName: company.companyName,
  country: company.country.getCountry(),
  businessSector: company.businessSector.getSector(),
  organizationType: company.organizationType.getType(),
  user: company.user ? userToResponse(company.user) : null,
});

export interface ProjectResponse {
  id: string;
  companyId: string;
  title: string;
  description: string;
  vertical: string;
  businessSectors: string[];
  projectStage: string;
}

export const projectToResponse = (project: Project): ProjectResponse => ({
  id: project.id,
  companyId: project.companyId,
  title: project.title,
  description: project.description,
  vertical: project.vertical.getVertical(),
  businessSectors: project.businessSectors.map((sector) => sector.getSector()),
  projectStage: project.projectStage.getStage(),
});
//Convierte la entidad dominio para que sea legible en JSON
export interface ProjectEditRequestResponse {
  id: string;
  projectId: string;
  companyId: string;
  requestedByUserId: string | null;
  proposedProject: ProjectResponse;
  status: string;
  createdAt: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export const projectEditRequestToResponse = (
  request: ProjectEditRequest,
): ProjectEditRequestResponse => ({
  id: request.id,
  projectId: request.proposedProject.id,
  companyId: request.proposedProject.companyId,
  requestedByUserId: request.requestedByUserId,
  proposedProject: projectToResponse(request.proposedProject),
  status: request.status,
  createdAt: request.createdAt.toISOString(),
  reviewedByUserId: request.reviewedByUserId,
  reviewedAt: request.reviewedAt?.toISOString() ?? null,
  rejectionReason: request.rejectionReason,
});
