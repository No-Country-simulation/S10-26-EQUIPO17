import { z } from "zod";
import { apiClient } from "../../shared/api/apiClient";
import { projectSchema } from "../project-submission/projectSchema";

const editRequestSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  companyId: z.string(),
  requestedByUserId: z.string(),
  proposedProject: projectSchema,
  status: z.string(),
  createdAt: z.string(),
  reviewedByUserId: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
});

export type EditRequest = z.infer<typeof editRequestSchema>;

export async function listEditRequests(signal?: AbortSignal): Promise<EditRequest[]> {
  const response = await apiClient<unknown>("/project-edit-requests", { method: "GET", signal });
  return z.array(editRequestSchema).parse(response);
}

export async function approveEditRequest(id: string): Promise<void> {
  await apiClient<unknown>(`/project-edit-requests/${encodeURIComponent(id)}/approve`, { method: "POST" });
}

export async function rejectEditRequest(id: string, reason: string): Promise<void> {
  await apiClient<unknown>(`/project-edit-requests/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
