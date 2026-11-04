import type { Project } from "../../domain/entities/project.js";
import { AccesoDenegadoError, NoEncontradoError } from "../../domain/errors.js";
import type { AcceptProject } from "../ports/in/accept-project.js";
import type { AuthenticatedUser } from "../ports/out/auth-provider.js";
import type { ProjectRepository } from "../ports/out/project-repository.js";

export class AcceptProjectUseCase implements AcceptProject {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(user: AuthenticatedUser, projectId: string): Promise<Project> {
    if (user.role !== "admin") {
      throw new AccesoDenegadoError("Only admins can accept projects");
    }
    const project = await this.projects.findById(projectId);
    if (!project) throw new NoEncontradoError("Project not found");

    // Throws ConflictoError if the project was already accepted or rejected.
    const accepted = project.approve();
    await this.projects.save(accepted);
    return accepted;
  }
}