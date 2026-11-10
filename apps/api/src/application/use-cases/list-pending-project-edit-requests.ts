import { AccesoDenegadoError } from "../../domain/errors.js";
import type { ListPendingProjectEditRequests } from "../ports/in/list-pending-project-edit-requests.js";
import type { AuthenticatedUser } from "../ports/out/auth-provider.js";
import type { ProjectEditRequestRepository } from "../ports/out/project-edit-request-repository.js";

export class ListPendingProjectEditRequestsUseCase implements ListPendingProjectEditRequests {
  constructor(private readonly editRequests: ProjectEditRequestRepository) {}

  async execute(user: AuthenticatedUser) {
    if (user.role !== "admin") {
      throw new AccesoDenegadoError(
        "Only admins can list pending project edit requests",
      );
    }

    return this.editRequests.findPending();
  }
}
