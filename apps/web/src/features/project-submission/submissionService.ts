import { apiClient } from "../../shared/api/apiClient";
import type { ChallengeFormValues } from "./challengeFormSchema";

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

// El login deja las cookies de sesión (HttpOnly) que exige POST /projects.
export function logIn(email: string, password: string) {
  return apiClient<{ role: string | null }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function createProject(values: ChallengeFormValues) {
  return apiClient<unknown>("/projects", {
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
