import { ValidacionError } from "../errors.js";
import { textoRequerido } from "../validaciones.js";
import { BusinessSector } from "../value-objects/business-sector.js";
import { ProjectStage } from "../value-objects/project-stage.js";
import { Vertical } from "../value-objects/vertical.js";

export interface ProjectProps {
  id: string;
  title: string;
  description: string;
  vertical: Vertical;
  businessSectors: BusinessSector[];
  projectStage: ProjectStage;
}

export class Project {
  private constructor(
    readonly id: string,
    readonly title: string,
    readonly description: string,
    readonly vertical: Vertical,
    readonly businessSectors: readonly BusinessSector[],
    readonly projectStage: ProjectStage,
  ) {}

  static create(props: ProjectProps): Project {
    if (props.businessSectors.length === 0) {
      throw new ValidacionError("At least one business sector is required");
    }
    return new Project(
      textoRequerido(props.id, "id"),
      textoRequerido(props.title, "title"),
      textoRequerido(props.description, "description"),
      props.vertical,
      [...props.businessSectors],
      props.projectStage,
    );
  }
}
