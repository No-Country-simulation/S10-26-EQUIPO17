import type { Project } from "../../../domain/entities/project.js";
import type { AuthenticatedUser } from "../out/auth-provider.js";

export interface UploadProjectData {
  title: string;
  description: string;
  vertical: string;
  businessSectors: string[];
  projectStage: string;
}

/** Publishes a project under the company of the authenticated user; only companies can do it. */
export interface UploadProject {
  execute(user: AuthenticatedUser, data: UploadProjectData): Promise<Project>;
}
