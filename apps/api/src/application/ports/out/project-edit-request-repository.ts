import type { ProjectEditRequest } from "../../../domain/entities/project-edit-request.js";

export interface ProjectEditRequestRepository {
  save(request: ProjectEditRequest): Promise<void>;
  findById(id: string): Promise<ProjectEditRequest | null>;
  findPendingByProjectId(projectId: string): Promise<ProjectEditRequest | null>;
  findPending(): Promise<ProjectEditRequest[]>;
  //Si se edita un proyecto y los cambios se aprueban, los aplica simultaneamente
  review(request: ProjectEditRequest): Promise<void>;
}
