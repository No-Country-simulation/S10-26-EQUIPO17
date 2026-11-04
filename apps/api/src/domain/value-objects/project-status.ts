import { ValidacionError } from "../errors.js";

enum EnumProjectStatus {
  pending = "pending",
  approved = "approved",
  rejected = "rejected",
}

/** Where a project is in the admin review: every uploaded project starts as pending. */
class ProjectStatus {
  static readonly PENDING = new ProjectStatus(EnumProjectStatus.pending);
  static readonly APPROVED = new ProjectStatus(EnumProjectStatus.approved);
  static readonly REJECTED = new ProjectStatus(EnumProjectStatus.rejected);

  private readonly status: EnumProjectStatus;

  constructor(status: string) {
    if (!ProjectStatus.isValidStatus(status)) {
      throw new ValidacionError(`Invalid project status: ${status}`);
    }
    this.status = status as EnumProjectStatus;
  }

  public getStatus(): EnumProjectStatus {
    return this.status;
  }

  public isPending(): boolean {
    return this.status === EnumProjectStatus.pending;
  }

  private static isValidStatus(status: string): boolean {
    return Object.values(EnumProjectStatus).includes(
      status as EnumProjectStatus,
    );
  }
}

export { ProjectStatus };
