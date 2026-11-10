import type { Project } from "../../../domain/entities/project.js";

export interface ProjectRepository {
  save(project: Project): Promise<void>;
}
