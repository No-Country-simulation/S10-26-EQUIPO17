import type { ProjectEditRequest } from "../../../domain/entities/project-edit-request.js";
import type { AuthenticatedUser } from "../out/auth-provider.js";

export type ProjectEditRequestDecision =
  | {
      type: "approve";
    }
  | {
      type: "reject";
      reason?: string;
    };

export interface ReviewProjectEditRequest {
  execute(
    user: AuthenticatedUser,
    requestId: string,
    decision: ProjectEditRequestDecision,
  ): Promise<ProjectEditRequest>;
}
