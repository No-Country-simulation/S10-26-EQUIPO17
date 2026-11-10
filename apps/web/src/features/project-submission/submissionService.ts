import { apiClient } from "../../shared/api/apiClient";
import type { ChallengeFormValues } from "./challengeFormSchema";

export interface Project {
  id: string;
  companyId: string;
  title: string;
  description: string;
  vertical: string;
  businessSectors: string[];
  projectStage: string;
}

export function registerCompany(values: ChallengeFormValues) {
  return apiClient<unknown>("/companies/register", {
    method: "POST",
    body: JSON.stringify({
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
      jobPosition: values.jobPosition,
      companyName: values.companyName,
      country: values.country,
      businessSector: values.businessSector,
      organizationType: values.organizationType,
    }),
  });
}

export function createProject(values: ChallengeFormValues) {
  return apiClient<Project>("/projects", {
    method: "POST",
    body: JSON.stringify({
      title: values.title,
      description: values.description,
      vertical: values.vertical,
      businessSectors: values.businessSectors,
      projectStage: values.projectStage,
    }),
  });
}
