// Forma de las filas en Postgres (ver supabase/migrations) y su traducción a entidades.
// El dominio no conoce nombres de columnas: eso queda encerrado acá.
import type { PostgrestError } from "@supabase/supabase-js";
import { BusinessSector } from "../../../../domain/value-objects/business-sector.js";
import { Company } from "../../../../domain/entities/company.js";
//import type { Project } from "../../../../domain/entities/project.js";
import { Country } from "../../../../domain/value-objects/country.js";
import { OrganizationType } from "../../../../domain/value-objects/organization-type.js";
import { User } from "../../../../domain/entities/user.js";
import { ConflictoError } from "../../../../domain/errors.js";
import { Email } from "../../../../domain/value-objects/email.js";
import { Project } from "../../../../domain/entities/project.js";
import { ProjectStage } from "../../../../domain/value-objects/project-stage.js";
import { Vertical } from "../../../../domain/value-objects/vertical.js";
import {
  ProjectEditRequest,
  type ProjectEditRequestStatus,
} from "../../../../domain/entities/project-edit-request.js";

export interface UserRow {
  id: string;
  email: string;
}

export interface CompanyRow {
  id: string;
  first_name: string;
  last_name: string;
  job_position: string;
  company_name: string;
  country: string;
  business_sector: string;
  organization_type: string;
  user_id: string | null;
}

export type CompanyWithUserRow = Omit<CompanyRow, "user_id"> & {
  user: UserRow | null;
};

export interface ProjectRow {
  id: string;
  company_id: string;
  title: string;
  description: string;
  vertical: string;
  business_sectors: string[];
  project_stage: string;
}

export const USER_COLUMNS = "id, email";
export const COMPANY_WITH_USER_COLUMNS = `id, first_name, last_name, job_position, company_name, country, business_sector, organization_type, user:users(${USER_COLUMNS})`;

export const rowToUser = (row: UserRow): User =>
  User.create({
    id: row.id,
    email: Email.create(row.email),
  });

export const companyToRow = (company: Company): CompanyRow => ({
  id: company.id,
  first_name: company.firstName,
  last_name: company.lastName,
  job_position: company.jobPosition,
  company_name: company.companyName,
  country: company.country.getCountry(),
  business_sector: company.businessSector.getSector(),
  organization_type: company.organizationType.getType(),
  user_id: company.user?.id ?? null,
});

export const rowToCompany = (row: CompanyWithUserRow): Company =>
  Company.create({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    jobPosition: row.job_position,
    companyName: row.company_name,
    country: new Country(row.country),
    businessSector: new BusinessSector(row.business_sector),
    organizationType: new OrganizationType(row.organization_type),
    user: row.user ? rowToUser(row.user) : null,
  });

export const projectToRow = (project: Project): ProjectRow => ({
  id: project.id,
  company_id: project.companyId,
  title: project.title,
  description: project.description,
  vertical: project.vertical.getVertical(),
  business_sectors: project.businessSectors.map((sector) => sector.getSector()),
  project_stage: project.projectStage.getStage(),
});
export const rowToProject = (row: ProjectRow): Project =>
  Project.create({
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    description: row.description,
    vertical: new Vertical(row.vertical),
    businessSectors: row.business_sectors.map(
      (sector) => new BusinessSector(sector),
    ),
    projectStage: new ProjectStage(row.project_stage),
  });
// Códigos de error de Postgres que el adaptador traduce.
const VIOLACION_UNICA = "23505";
export const TEXTO_NO_ES_UUID = "22P02";

export function traducirError(error: PostgrestError): Error {
  if (error.code === VIOLACION_UNICA) {
    return new ConflictoError("El registro ya existe");
  }
  return new Error(`Supabase: ${error.message}`, { cause: error });
}
export interface ProjectEditRequestRow {
  id: string;
  project_id: string;
  company_id: string;
  requested_by_user_id: string | null;

  proposed_title: string;
  proposed_description: string;
  proposed_vertical: string;
  proposed_business_sectors: string[];
  proposed_project_stage: string;

  status: ProjectEditRequestStatus;
  created_at: string;

  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}
export const projectEditRequestToRow = (
  request: ProjectEditRequest,
): ProjectEditRequestRow => ({
  id: request.id,
  project_id: request.proposedProject.id,
  company_id: request.proposedProject.companyId,
  requested_by_user_id: request.requestedByUserId,

  proposed_title: request.proposedProject.title,
  proposed_description: request.proposedProject.description,
  proposed_vertical: request.proposedProject.vertical.getVertical(),
  proposed_business_sectors: request.proposedProject.businessSectors.map(
    (sector) => sector.getSector(),
  ),
  proposed_project_stage: request.proposedProject.projectStage.getStage(),

  status: request.status,
  created_at: request.createdAt.toISOString(),

  reviewed_by_user_id: request.reviewedByUserId,
  reviewed_at: request.reviewedAt?.toISOString() ?? null,
  rejection_reason: request.rejectionReason,
});

export const rowToProjectEditRequest = (
  row: ProjectEditRequestRow,
): ProjectEditRequest =>
  ProjectEditRequest.create({
    id: row.id,

    proposedProject: rowToProject({
      id: row.project_id,
      company_id: row.company_id,
      title: row.proposed_title,
      description: row.proposed_description,
      vertical: row.proposed_vertical,
      business_sectors: row.proposed_business_sectors,
      project_stage: row.proposed_project_stage,
    }),

    requestedByUserId: row.requested_by_user_id,
    status: row.status,
    createdAt: new Date(row.created_at),
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    rejectionReason: row.rejection_reason,
  });
