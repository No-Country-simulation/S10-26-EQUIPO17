import type { Project } from "../../../domain/entities/project.js";

export interface ProjectRepository {
  save(project: Project): Promise<void>;
  findById(id: string): Promise<Project | null>;
  findByCompanyId(companyId: string): Promise<Project[]>;
}
