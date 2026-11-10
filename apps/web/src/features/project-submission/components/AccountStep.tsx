import { useFormContext } from "react-hook-form";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { FormField } from "./FormField";
import { ProfileStep } from "./ProfileStep";

// Credenciales de acceso + datos del representante.
export function AccountStep() {
  const { register, formState: { errors } } = useFormContext<ChallengeFormValues>();

  return (
    <div className="space-y-2">
      <div className="grid gap-x-4 gap-y-2 border-b border-neutral/60 pb-4 md:grid-cols-2">
        <FormField label="Correo electrónico" error={errors.email?.message} hint="Será tu usuario para iniciar sesión.">
          <input {...register("email")} type="email" autoComplete="email" className="input w-full" placeholder="nombre@empresa.com" />
        </FormField>

        <FormField label="Contraseña" error={errors.password?.message} hint="Mínimo 8 caracteres.">
          <input {...register("password")} type="password" autoComplete="new-password" className="input w-full" placeholder="••••••••" />
        </FormField>
      </div>

      <ProfileStep />

      <fieldset className="fieldset">
        <label className="label cursor-pointer justify-start gap-3 text-sm text-neutral-content">
          <input {...register("acceptTerms")} type="checkbox" className="checkbox checkbox-primary checkbox-sm" />
          Acepto los términos de servicio de NoCountry.
        </label>
        {errors.acceptTerms && (
          <p role="alert" className="label text-xs text-error">{errors.acceptTerms.message}</p>
        )}
      </fieldset>
    </div>
  );
}
