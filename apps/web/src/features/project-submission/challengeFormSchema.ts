import { z } from "zod";
import {
  countryOptions,
  orgTypeOptions,
  sectorOptions,
  stageOptions,
  verticalOptions,
} from "./challengeFormOptions";

export const DESCRIPTION_MAX_LENGTH = 600;

function enumValues<T extends string>(options: { value: T }[]) {
  return options.map((option) => option.value) as [T, ...T[]];
}

const verticals = verticalOptions.map((option) => option.value);

// Un solo esquema con todos los campos: cada flujo valida solo los de sus pasos (ver challengeFlows).
export const challengeSchema = z.object({
  email: z.email("Ingresa un correo electrónico válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  acceptTerms: z.boolean().refine((accepted) => accepted, "Debes aceptar los términos para continuar"),

  firstName: z.string().trim().min(1, "Ingresa tu nombre"),
  lastName: z.string().trim().min(1, "Ingresa tu apellido"),
  jobPosition: z.string().trim().min(1, "Ingresa tu puesto o cargo"),

  companyName: z.string().trim().min(1, "El nombre de la empresa es obligatorio"),
  organizationType: z.enum(enumValues(orgTypeOptions), { error: "Selecciona un tipo de organización" }),
  country: z.enum(enumValues(countryOptions), { error: "Selecciona un país" }),
  businessSector: z.enum(enumValues(sectorOptions), { error: "Selecciona un sector" }),

  title: z.string().trim().min(5, "El título debe tener al menos 5 caracteres"),
  description: z
    .string()
    .trim()
    .min(20, "Describe mejor tu desafío (mínimo 20 caracteres)")
    .max(DESCRIPTION_MAX_LENGTH, `Máximo ${DESCRIPTION_MAX_LENGTH} caracteres`),
  projectStage: z.enum(enumValues(stageOptions), { error: "Selecciona la etapa del proyecto" }),
  vertical: z.string().refine((value) => verticals.includes(value), "Selecciona una vertical"),
  businessSectors: z.array(z.string()).min(1, "Selecciona al menos un sector"),
});

export type ChallengeFormValues = z.infer<typeof challengeSchema>;
export type ChallengeField = keyof ChallengeFormValues;

export const challengeDefaultValues: ChallengeFormValues = {
  email: "",
  password: "",
  acceptTerms: false,
  firstName: "",
  lastName: "",
  jobPosition: "",
  companyName: "",
  organizationType: "StartUp",
  country: "Argentina",
  businessSector: "Software Development",
  title: "",
  description: "",
  projectStage: "Idea",
  vertical: "",
  businessSectors: [],
};
