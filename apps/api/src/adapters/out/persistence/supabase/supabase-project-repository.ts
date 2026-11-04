import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectRepository } from "../../../../application/ports/out/project-repository.js";
import type { Project } from "../../../../domain/entities/project.js";
import {
  PROJECT_COLUMNS,
  projectToRow,
  rowToProject,
  TEXTO_NO_ES_UUID,
  traducirError,
  type ProjectRow,
} from "./filas.js";

export class SupabaseProjectRepository implements ProjectRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(project: Project): Promise<void> {
    const { error } = await this.supabase.from("projects").upsert(projectToRow(project));
    if (error) throw traducirError(error);
  }

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("id", id)
      .maybeSingle<ProjectRow>();
    // An id that is not a UUID cannot exist in the table.
    if (error?.code === TEXTO_NO_ES_UUID) return null;
    if (error) throw traducirError(error);
    return data ? rowToProject(data) : null;
  }
}