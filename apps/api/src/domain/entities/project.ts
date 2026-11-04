import { ConflictoError, ValidacionError } from "../errors.js";
import { textoRequerido } from "../validaciones.js";
import { BusinessSector } from "../value-objects/business-sector.js";
import { ProjectStage } from "../value-objects/project-stage.js";
import { ProjectStatus } from "../value-objects/project-status.js";
import { Vertical } from "../value-objects/vertical.js";

export interface ProjectProps {
  id: string;
  companyId: string;
  title: string;
  description: string;
  vertical: Vertical;
  businessSectors: BusinessSector[];
  projectStage: ProjectStage;
  /** Defaults to pending: a new project waits for an admin to review it. */
  status?: ProjectStatus;
}

export class Project {
  private constructor(
    readonly id: string,
    readonly companyId: string,
    readonly title: string,
    readonly description: string,
    readonly vertical: Vertical,
    readonly businessSectors: readonly BusinessSector[],
    readonly projectStage: ProjectStage,
    readonly status: ProjectStatus,
  ) {}

  static create(props: ProjectProps): Project {
    if (props.businessSectors.length === 0) {
      throw new ValidacionError("At least one business sector is required");
    }
    return new Project(
      textoRequerido(props.id, "id"),
      textoRequerido(props.companyId, "companyId"),
      textoRequerido(props.title, "title"),
      textoRequerido(props.description, "description"),
      props.vertical,
      [...props.businessSectors],
      props.projectStage,
      props.status ?? ProjectStatus.PENDING,
    );
  }

  /** Only a pending project can be accepted; returns the accepted copy. */
  approve(): Project {
    return this.withStatus(ProjectStatus.APPROVED);
  }

  private withStatus(status: ProjectStatus): Project {
    if (!this.status.isPending()) {
      throw new ConflictoError(
        `Project already reviewed (status: ${this.status.getStatus()})`,
      );
    }
    return new Project(
      this.id,
      this.companyId,
      this.title,
      this.description,
      this.vertical,
      this.businessSectors,
      this.projectStage,
      status,
    );
  }
}
