import { z } from "zod";
import { apiClient } from "../../shared/api/apiClient";
import type { Project } from "../project-submission/submissionService";
import { projectSchema } from "../project-submission/projectSchema";

export async function listProjects(signal?: AbortSignal): Promise<Project[]> {
  const response = await apiClient<unknown>("/projects", { method: "GET", signal });
  return z.array(projectSchema).parse(response);
}
