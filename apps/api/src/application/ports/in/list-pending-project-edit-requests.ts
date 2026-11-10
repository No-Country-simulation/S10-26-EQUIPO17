import type { ProjectEditRequest } from "../../../domain/entities/project-edit-request.js";
import type { AuthenticatedUser } from "../out/auth-provider.js";

export interface ListPendingProjectEditRequests {
  execute(user: AuthenticatedUser): Promise<ProjectEditRequest[]>;
}
