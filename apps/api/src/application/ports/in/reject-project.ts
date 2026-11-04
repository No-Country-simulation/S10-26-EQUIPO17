import type { Project } from "../../../domain/entities/project.js";
import type { AuthenticatedUser } from "../out/auth-provider.js";

/** Rejects a pending project so it does not join the simulation; only admins can do it. */
export interface RejectProject {
  execute(user: AuthenticatedUser, projectId: string): Promise<Project>;
}
