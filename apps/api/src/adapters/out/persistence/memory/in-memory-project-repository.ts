import type { ProjectRepository } from "../../../../application/ports/out/project-repository.js";
import type { Project } from "../../../../domain/entities/project.js";

/** In-memory implementation of the port. Used by tests and to develop without a database. */
export class InMemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, Project>();

  async save(project: Project): Promise<void> {
    this.projects.set(project.id, project);
  }
  async findByCompanyId(companyId: string): Promise<Project[]> {
    return [...this.projects.values()].filter(
      (project) => project.companyId === companyId,
    );
  }
  /** Not part of the port: lets tests check what was saved. */
  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) ?? null;
  }

  /** Not part of the port: lets tests check that nothing was saved. */
  count(): number {
    return this.projects.size;
  }
}
