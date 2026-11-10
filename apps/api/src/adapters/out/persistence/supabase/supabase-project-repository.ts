import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectRepository } from "../../../../application/ports/out/project-repository.js";
import type { Project } from "../../../../domain/entities/project.js";
import {
  projectToRow,
  rowToProject,
  traducirError,
  TEXTO_NO_ES_UUID,
  type ProjectRow,
} from "./filas.js";

export class SupabaseProjectRepository implements ProjectRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(project: Project): Promise<void> {
    const { error } = await this.supabase
      .from("projects")
      .upsert(projectToRow(project));
    if (error) throw traducirError(error);
  }

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from("projects")
      .select(
        "id,company_id,title,description,vertical,business_sectors,project_stage",
      )
      .eq("id", id)
      .maybeSingle<ProjectRow>();

    if (error?.code === TEXTO_NO_ES_UUID) return null;
    if (error) throw traducirError(error);

    return data ? rowToProject(data) : null;
  }

  async findByCompanyId(companyId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from("projects")
      .select(
        "id,company_id,title,description,vertical,business_sectors,project_stage",
      )
      .eq("company_id", companyId)
      .overrideTypes<ProjectRow[], { merge: false }>();
    if (error) throw traducirError(error);

    return (data ?? []).map(rowToProject);
  }
}
