import type { Project } from "../../../domain/entities/project.js";

export interface ProjectRepository {
  /** Inserts the project or overwrites it if the id already exists. */
  save(project: Project): Promise<void>;
  findById(id: string): Promise<Project | null>;
}
