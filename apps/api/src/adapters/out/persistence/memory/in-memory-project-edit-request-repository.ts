import type { ProjectEditRequestRepository } from "../../../../application/ports/out/project-edit-request-repository.js";
import type { ProjectRepository } from "../../../../application/ports/out/project-repository.js";
import type { ProjectEditRequest } from "../../../../domain/entities/project-edit-request.js";
import {
  ConflictoError,
  NoEncontradoError,
} from "../../../../domain/errors.js";

export class InMemoryProjectEditRequestRepository implements ProjectEditRequestRepository {
  private readonly requests = new Map<string, ProjectEditRequest>();

  constructor(private readonly projects: ProjectRepository) {}

  async save(request: ProjectEditRequest): Promise<void> {
    this.requests.set(request.id, request);
  }

  async findById(id: string): Promise<ProjectEditRequest | null> {
    return this.requests.get(id) ?? null;
  }

  async findPendingByProjectId(
    projectId: string,
  ): Promise<ProjectEditRequest | null> {
    return (
      [...this.requests.values()].find(
        (request) =>
          request.proposedProject.id === projectId &&
          request.status === "pending",
      ) ?? null
    );
  }

  async findPending(): Promise<ProjectEditRequest[]> {
    return [...this.requests.values()].filter(
      (request) => request.status === "pending",
    );
  }

  async review(request: ProjectEditRequest): Promise<void> {
    const existing = await this.findById(request.id);

    if (!existing) {
      throw new NoEncontradoError("Project edit request not found");
    }

    if (existing.status !== "pending") {
      throw new ConflictoError("This request has already been reviewed");
    }

    if (request.status === "approved") {
      await this.projects.save(request.proposedProject);
    } else if (request.status !== "rejected") {
      throw new ConflictoError("The request must be approved or rejected");
    }

    this.requests.set(request.id, request);
  }
}
