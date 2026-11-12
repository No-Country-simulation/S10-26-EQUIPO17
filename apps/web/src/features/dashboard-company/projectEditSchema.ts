import { z } from "zod";
import { sectorOptions, stageOptions, verticalOptions } from "../project-submission/challengeFormOptions";
import type { Project } from "../project-submission/submissionService";

export const projectEditSchema = z.object({
  title: z.string().trim().min(1, "Ingresa un título."),
  description: z.string().trim().min(1, "Ingresa una descripción."),
  vertical: z.string().refine((value) => verticalOptions.some((option) => option.value === value), "Selecciona una vertical válida."),
  businessSectors: z.array(z.string())
    .min(1, "Selecciona al menos un sector.")
    .refine((values) => values.every((value) => sectorOptions.some((option) => option.value === value)), "Selecciona sectores válidos."),
  projectStage: z.string().refine((value) => stageOptions.some((option) => option.value === value), "Selecciona una etapa válida."),
});

export type ProjectEditValues = z.input<typeof projectEditSchema>;

export function projectEditValues(project: Project): ProjectEditValues {
  return {
    title: project.title,
    description: project.description,
    vertical: project.vertical,
    businessSectors: [...project.businessSectors],
    projectStage: project.projectStage,
  };
}

export function hasProjectChanges(values: ProjectEditValues, project: Project): boolean {
  const sectors = [...values.businessSectors].sort();
  const originalSectors = [...project.businessSectors].sort();
  return values.title.trim() !== project.title.trim()
    || values.description.trim() !== project.description.trim()
    || values.vertical !== project.vertical
    || values.projectStage !== project.projectStage
    || sectors.length !== originalSectors.length
    || sectors.some((value, index) => value !== originalSectors[index]);
}
