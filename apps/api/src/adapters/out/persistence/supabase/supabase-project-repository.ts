import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectRepository } from "../../../../application/ports/out/project-repository.js";
import type { Project } from "../../../../domain/entities/project.js";
import { projectToRow, traducirError } from "./filas.js";

export class SupabaseProjectRepository implements ProjectRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(project: Project): Promise<void> {
    const { error } = await this.supabase.from("projects").upsert(projectToRow(project));
    if (error) throw traducirError(error);
  }
}
