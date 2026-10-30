import { textoRequerido } from "../validaciones.js";
import { BusinessSector } from "../value-objects/business-sector.js";
import { ProjectStage } from "../value-objects/project-stage.js";
import { Vertical } from "../value-objects/vertical.js";

export interface ProjectProps {
  id: string;
  title: string;
  description: string;
  vertical: Vertical;
  businessSector: BusinessSector;
  projectStage: ProjectStage;
}

export class Project {
  private constructor(
    readonly id: string,
    readonly title: string,
    readonly description: string,
    readonly vertical: Vertical,
    readonly businessSector: BusinessSector,
    readonly projectStage: ProjectStage,
  ) {}

  static create(props: ProjectProps): Project {
    return new Project(
      textoRequerido(props.id, "id"),
      textoRequerido(props.title, "title"),
      textoRequerido(props.description, "description"),
      props.vertical,
      props.businessSector,
      props.projectStage,
    );
  }
}
