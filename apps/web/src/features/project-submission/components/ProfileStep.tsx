import { useFormContext } from "react-hook-form";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { RegistrationField } from "./RegistrationField";

export function ProfileStep() {
  const { register } = useFormContext<ChallengeFormValues>();

  return (
    <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
      <RegistrationField name="firstName" label="Nombre">
        {(accessibility) => <input {...register("firstName")} {...accessibility} aria-label="Nombre" type="text" autoComplete="given-name" required className="input validator w-full" placeholder="Ej. Valentina" />}
      </RegistrationField>

      <RegistrationField name="lastName" label="Apellido">
        {(accessibility) => <input {...register("lastName")} {...accessibility} aria-label="Apellido" type="text" autoComplete="family-name" required className="input validator w-full" placeholder="Ej. Rossi" />}
      </RegistrationField>

      <RegistrationField
        name="jobPosition"
        label="Puesto de trabajo / cargo"
        hint="Tu rol en relación al requerimiento."
        className="md:col-span-2"
      >
        {(accessibility) => <input {...register("jobPosition")} {...accessibility} aria-label="Puesto de trabajo / cargo" type="text" autoComplete="organization-title" required className="input validator w-full" placeholder="Ej. Product Lead" />}
      </RegistrationField>
    </div>
  );
}
