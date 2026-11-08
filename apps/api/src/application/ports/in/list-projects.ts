import type { Project } from "../../../domain/entities/project.js";
import type { AuthenticatedUser } from "../out/auth-provider.js";

/** lista los proyectos de la compañia  */
export interface ListProjects {
  execute(user: AuthenticatedUser): Promise<Project[]>;
}
