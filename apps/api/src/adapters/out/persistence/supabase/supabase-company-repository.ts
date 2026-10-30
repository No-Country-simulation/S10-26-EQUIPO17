import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyRepository } from "../../../../application/ports/out/company-repository.js";
import type { Company } from "../../../../domain/entities/company.js";
import {
  COMPANY_WITH_USER_COLUMNS,
  companyToRow,
  rowToCompany,
  TEXTO_NO_ES_UUID,
  traducirError,
  type CompanyWithUserRow,
} from "./filas.js";

export class SupabaseCompanyRepository implements CompanyRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(company: Company): Promise<void> {
    const { error } = await this.supabase
      .from("companies")
      .upsert(companyToRow(company));
    if (error) throw traducirError(error);
  }

  async findById(id: string): Promise<Company | null> {
    const { data, error } = await this.supabase
      .from("companies")
      .select(COMPANY_WITH_USER_COLUMNS)
      .eq("id", id)
      .maybeSingle<CompanyWithUserRow>();
    // An id that is not a UUID cannot exist in the table.
    if (error?.code === TEXTO_NO_ES_UUID) return null;
    if (error) throw traducirError(error);
    return data ? rowToCompany(data) : null;
  }
}
