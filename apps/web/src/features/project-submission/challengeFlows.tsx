import type { ComponentType } from "react";
import { challengeSchema, type ChallengeField } from "./challengeFormSchema";
import { AccountStep } from "./components/AccountStep";
import { OrganizationStep } from "./components/OrganizationStep";
import { ProfileStep } from "./components/ProfileStep";
import { ProjectStep } from "./components/ProjectStep";

export type PreviewSection = "profile" | "organization" | "project";

export interface WizardStepConfig {
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  fields: ChallengeField[];
  sections: PreviewSection[];
  Component: ComponentType;
}

export interface WizardFlow {
  id: "guest" | "register" | "project";
  steps: WizardStepConfig[];
  // Valida solo los campos que pertenecen a los pasos del flujo.
  schema: typeof challengeSchema;
}

function createFlow(id: WizardFlow["id"], steps: WizardStepConfig[]): WizardFlow {
  const mask = Object.fromEntries(steps.flatMap((step) => step.fields).map((field) => [field, true as const]));
  return { id, steps, schema: challengeSchema.pick(mask as never) as unknown as typeof challengeSchema };
}

const profileStep: WizardStepConfig = {
  title: "Tu perfil profesional",
  shortTitle: "Perfil",
  icon: "badge",
  description: "Completa los datos de quien representará y guiará al equipo en las revisiones semanales.",
  fields: ["firstName", "lastName", "jobPosition"],
  sections: ["profile"],
  Component: ProfileStep,
};

const organizationStep: WizardStepConfig = {
  title: "Organización y entorno",
  shortTitle: "Entorno",
  icon: "apartment",
  description: "Permite calibrar el equipo según el tamaño y la dinámica de trabajo de tu organización.",
  fields: ["companyName", "organizationType", "country", "businessSector"],
  sections: ["organization"],
  Component: OrganizationStep,
};

const projectStep: WizardStepConfig = {
  title: "Proyecto",
  shortTitle: "Proyecto",
  icon: "code_blocks",
  description: "Define el objetivo técnico del sprint para armar el equipo multidisciplinario idóneo.",
  fields: ["title", "description", "projectStage", "vertical", "businessSectors"],
  sections: ["project"],
  Component: ProjectStep,
};

// Invitado: sin cuenta ni contraseña, los datos no se envían a la API.
export const guestFlow = createFlow("guest", [profileStep, organizationStep, projectStep]);

// Registro de empresa (POST /companies/register); después se sube el proyecto con la sesión iniciada.
export const registerFlow = createFlow("register", [
  {
    ...profileStep,
    title: "Tu cuenta y perfil",
    shortTitle: "Cuenta",
    icon: "person_add",
    description: "Crea tus credenciales y completa los datos de quien representará a la empresa.",
    fields: ["email", "password", "acceptTerms", "firstName", "lastName", "jobPosition"],
    Component: AccountStep,
  },
  organizationStep,
]);

export const projectFlow = createFlow("project", [projectStep]);
