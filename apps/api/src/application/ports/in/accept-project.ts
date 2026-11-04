import type { Project } from "../../../domain/entities/project.js";
import type { AuthenticatedUser } from "../out/auth-provider.js";

/** Accepts a pending project so it can join the simulation; only admins can do it. */
export interface AcceptProject {
  execute(user: AuthenticatedUser, projectId: string): Promise<Project>;
}
