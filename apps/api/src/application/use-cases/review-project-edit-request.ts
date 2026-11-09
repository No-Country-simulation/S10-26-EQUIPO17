import type { ReviewProjectEditRequest } from "../ports/in/review-project-edit-request.js";
import type { ProjectEditRequestDecision } from "../ports/in/review-project-edit-request.js";
import type { AuthenticatedUser } from "../ports/out/auth-provider.js";
import type { ProjectEditRequestRepository } from "../ports/out/project-edit-request-repository.js";

import { AccesoDenegadoError, NoEncontradoError } from "../../domain/errors.js";
export class ReviewProjectEditRequestUseCase implements ReviewProjectEditRequest {
  constructor(private readonly editRequests: ProjectEditRequestRepository) {}

  async execute(
    user: AuthenticatedUser,
    requestId: string,
    decision: ProjectEditRequestDecision,
  ) {
    //this is to trigger a 403 regardless of request id being valid, to prevent company user
    //from viewing if other companies have edit requests
    if (user.role !== "admin") {
      throw new AccesoDenegadoError(
        "Only admin can review project edit requests",
      );
    }
    const request = await this.editRequests.findById(requestId);

    if (!request) {
      throw new NoEncontradoError("Project edit request not found");
    }
    const reviewRequest =
      decision.type === "approve"
        ? request.approve(user.userId)
        : request.reject(user.userId, decision.reason);

    await this.editRequests.review(reviewRequest);

    return reviewRequest;
  }
}
