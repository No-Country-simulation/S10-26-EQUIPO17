import { useFormContext } from "react-hook-form";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { FormField } from "./FormField";
import { StepCard } from "./StepCard";

export function ProfileStep() {
  const { register, formState: { errors } } = useFormContext<ChallengeFormValues>();

  return (
    <StepCard
      stepIndex={0}
      description="Completa los datos de quien representará y guiará al equipo en las revisiones semanales."
    >
      <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
        <FormField label="Nombre y apellido" error={errors.fullName?.message} hint="Nombre visible para el equipo.">
          <input {...register("fullName")} type="text" className="input w-full" placeholder="Ej. Valentina Rossi" />
        </FormField>

        <FormField label="Empresa / entidad" error={errors.company?.message} hint="Marca o denominación comercial.">
          <input {...register("company")} type="text" className="input w-full" placeholder="Ej. NovaTech Solutions" />
        </FormField>

        <FormField
          label="Puesto de trabajo / cargo"
          optional
          error={errors.jobRole?.message}
          hint="Tu rol en relación al requerimiento."
          className="md:col-span-2"
        >
          <input {...register("jobRole")} type="text" className="input w-full" placeholder="Ej. Product Lead" />
        </FormField>
      </div>
    </StepCard>
  );
}
