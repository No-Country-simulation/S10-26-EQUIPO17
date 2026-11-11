import { z } from "zod";
import { apiClient } from "../../shared/api/apiClient";
import type { Project } from "../project-submission/submissionService";

const projectSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  title: z.string(),
  description: z.string(),
  vertical: z.string(),
  businessSectors: z.array(z.string()),
  projectStage: z.string(),
});

export async function listProjects(signal?: AbortSignal): Promise<Project[]> {
  const response = await apiClient<unknown>("/projects", { method: "GET", signal });
  return z.array(projectSchema).parse(response);
}
