import { useFormContext } from "react-hook-form";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { FormField } from "./FormField";

export function ProfileStep() {
  const { register, formState: { errors } } = useFormContext<ChallengeFormValues>();

  return (
    <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
      <FormField label="Nombre" error={errors.firstName?.message}>
        <input {...register("firstName")} type="text" autoComplete="given-name" className="input w-full" placeholder="Ej. Valentina" />
      </FormField>

      <FormField label="Apellido" error={errors.lastName?.message}>
        <input {...register("lastName")} type="text" autoComplete="family-name" className="input w-full" placeholder="Ej. Rossi" />
      </FormField>

      <FormField
        label="Puesto de trabajo / cargo"
        error={errors.jobPosition?.message}
        hint="Tu rol en relación al requerimiento."
        className="md:col-span-2"
      >
        <input {...register("jobPosition")} type="text" autoComplete="organization-title" className="input w-full" placeholder="Ej. Product Lead" />
      </FormField>
    </div>
  );
}
