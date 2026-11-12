import { z } from "zod";

export const projectSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  title: z.string(),
  description: z.string(),
  vertical: z.string(),
  businessSectors: z.array(z.string()),
  projectStage: z.string(),
});
