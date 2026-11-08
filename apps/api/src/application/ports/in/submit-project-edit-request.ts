import type { ProjectEditRequest } from "../../../domain/entities/project-edit-request.js";
import type { AuthenticatedUser } from "../out/auth-provider.js";

export interface SubmitProjectEditRequestData {
  title?: string;
  description?: string;
  vertical?: string;
  businessSectors?: string[];
  projectStage?: string;
}

// envia los cambios solicitados al proyecto sin aplicarlos al mismo
export interface SubmitProjectEditRequest {
  execute(
    user: AuthenticatedUser,
    projectId: string,
    data: SubmitProjectEditRequestData,
  ): Promise<ProjectEditRequest>;
}
