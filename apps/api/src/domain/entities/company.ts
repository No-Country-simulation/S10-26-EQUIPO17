import { textoRequerido } from "../validaciones.js";
import type { User } from "./user.js";

export interface CompanyProps {
  id: string;
  firstName: string;
  lastName: string;
  jobPosition: string;
  companyName: string;
  user?: User | null;
}

export class Company {
  private constructor(
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly jobPosition: string,
    readonly companyName: string,
    readonly user: User | null,
  ) {}

  static create(props: CompanyProps): Company {
    return new Company(
      textoRequerido(props.id, "id"),
      textoRequerido(props.firstName, "firstName"),
      textoRequerido(props.lastName, "lastName"),
      textoRequerido(props.jobPosition, "jobPosition"),
      textoRequerido(props.companyName, "companyName"),
      props.user ?? null,
    );
  }
}
