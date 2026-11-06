import { z } from "zod";
import { orgTypeOptions, stageOptions } from "./challengeFormOptions";

export const DESCRIPTION_MAX_LENGTH = 600;

const orgTypes = orgTypeOptions.map((o) => o.value) as [string, ...string[]];
const stages = stageOptions.map((o) => o.value) as [string, ...string[]];

export const challengeSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa tu nombre y apellido"),
  company: z.string().trim().min(2, "El nombre de la empresa es obligatorio"),
  jobRole: z.string().trim().optional(),

  orgType: z.enum(orgTypes, { error: "Selecciona un tipo de organización" }),
  country: z.string().min(1, "Selecciona un país"),
  sectors: z.array(z.string()).min(1, "Selecciona al menos un sector"),

  title: z.string().trim().min(5, "El título debe tener al menos 5 caracteres"),
  description: z
    .string()
    .trim()
    .min(20, "Describe mejor tu desafío (mínimo 20 caracteres)")
    .max(DESCRIPTION_MAX_LENGTH, `Máximo ${DESCRIPTION_MAX_LENGTH} caracteres`),
  stage: z.enum(stages, { error: "Selecciona la etapa del proyecto" }),
  verticals: z.array(z.string()).min(1, "Selecciona al menos una vertical"),

  email: z.email("Ingresa un correo electrónico válido"),
  acceptTerms: z.boolean().refine((accepted) => accepted, "Debes aceptar los términos para continuar"),
});

export type ChallengeFormValues = z.infer<typeof challengeSchema>;

export const challengeDefaultValues: ChallengeFormValues = {
  fullName: "",
  company: "",
  jobRole: "",
  orgType: "startup",
  country: "Argentina",
  sectors: [],
  title: "",
  description: "",
  stage: "idea",
  verticals: [],
  email: "",
  acceptTerms: false,
};

// Campos que se validan antes de avanzar en cada paso.
export const stepFields: (keyof ChallengeFormValues)[][] = [
  ["fullName", "company", "jobRole"],
  ["orgType", "country", "sectors"],
  ["title", "description", "stage", "verticals"],
  ["email", "acceptTerms"],
];
