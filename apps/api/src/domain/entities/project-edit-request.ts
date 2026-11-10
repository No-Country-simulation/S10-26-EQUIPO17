import { ConflictoError, ValidacionError } from "../errors.js";
import { textoRequerido } from "../validaciones.js";
import type { Project } from "./project.js";

export type ProjectEditRequestStatus = "pending" | "approved" | "rejected";

export interface ProjectEditRequestProps {
  id: string;
  proposedProject: Project;
  requestedByUserId: string | null;
  status?: ProjectEditRequestStatus;
  createdAt?: Date;
  reviewedByUserId?: string | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
}
// el proposedProject reutiliza la entidad project ya existente
export class ProjectEditRequest {
  private constructor(
    readonly id: string,
    readonly proposedProject: Project,
    readonly requestedByUserId: string | null,
    readonly status: ProjectEditRequestStatus,
    readonly createdAt: Date,
    readonly reviewedByUserId: string | null,
    readonly reviewedAt: Date | null,
    readonly rejectionReason: string | null,
  ) {}
  static create(props: ProjectEditRequestProps): ProjectEditRequest {
    const status = props.status ?? "pending";
    const createdAt = props.createdAt ?? new Date();
    const reviewedByUserId = props.reviewedByUserId ?? null;
    const reviewedAt = props.reviewedAt ?? null;
    const rejectionReason = props.rejectionReason?.trim() || null;
    //catches invalid dates
    if (Number.isNaN(createdAt.getTime())) {
      throw new ValidacionError("Invalid request creation date");
    }

    if (reviewedAt && Number.isNaN(reviewedAt.getTime())) {
      throw new ValidacionError("Invalid request review date");
    }

    if (status === "pending" && (reviewedByUserId || reviewedAt)) {
      throw new ValidacionError(
        "A pending request cannot have review information",
      );
    }

    if (status !== "pending" && !reviewedAt) {
      throw new ValidacionError(
        "A reviewed request must have review information",
      );
    }
    if (status !== "rejected" && rejectionReason) {
      throw new ValidacionError(
        "Only rejected requests can have a rejection reason",
      );
    }
    return new ProjectEditRequest(
      textoRequerido(props.id, "id"),
      props.proposedProject,
      props.requestedByUserId === null
        ? null
        : textoRequerido(props.requestedByUserId, "requestedByUserId"),
      status,
      new Date(createdAt),
      reviewedByUserId
        ? textoRequerido(reviewedByUserId, "reviewedByUserId")
        : null,
      reviewedAt ? new Date(reviewedAt) : null,
      rejectionReason,
    );
  }
  approve(
    reviewerId: string,
    reviewedAt: Date = new Date(),
  ): ProjectEditRequest {
    this.ensurePending();
    //ensurePending existe para impedir que se puede aprobar o rechazar el mismo
    //project repetidas veces
    return ProjectEditRequest.create({
      id: this.id,
      proposedProject: this.proposedProject,
      requestedByUserId: this.requestedByUserId,
      status: "approved",
      createdAt: this.createdAt,
      reviewedByUserId: reviewerId,
      reviewedAt,
    });
  }
  reject(
    reviewerId: string,
    reason?: string,
    reviewedAt: Date = new Date(),
  ): ProjectEditRequest {
    this.ensurePending();

    return ProjectEditRequest.create({
      id: this.id,
      proposedProject: this.proposedProject,
      requestedByUserId: this.requestedByUserId,
      status: "rejected",
      createdAt: this.createdAt,
      reviewedByUserId: reviewerId,
      reviewedAt,
      rejectionReason: reason,
    });
  }

  private ensurePending(): void {
    if (this.status !== "pending") {
      throw new ConflictoError("Only pending edit requests can be reviewed");
    }
  }
}
