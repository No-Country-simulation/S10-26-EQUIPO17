import type { Company } from "../../../domain/entities/company.js";

export interface GetCompany {
  execute(id: string): Promise<Company>;
}
