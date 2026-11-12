import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { RegistrationField } from "./RegistrationField";
import { ProfileStep } from "./ProfileStep";

// Credenciales de acceso + datos del representante.
export function AccountStep() {
  const { register } = useFormContext<ChallengeFormValues>();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <div className="grid gap-x-4 gap-y-2 border-b border-neutral/60 pb-4 md:grid-cols-2">
        <RegistrationField name="email" label="Correo electrónico" hint="Será tu usuario para iniciar sesión.">
          {(accessibility) => <input {...register("email")} {...accessibility} aria-label="Correo electrónico" type="email" autoComplete="email" required className="input validator w-full" placeholder="nombre@empresa.com" />}
        </RegistrationField>

        <RegistrationField name="password" label="Contraseña" hint="Mínimo 8 caracteres.">
          {(accessibility) => (
            <div className="relative">
              <input {...register("password")} {...accessibility} aria-label="Contraseña" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} className="input validator w-full pr-12" placeholder="••••••••" />
              <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="btn btn-ghost btn-sm btn-square absolute right-1 top-1/2 -translate-y-1/2 text-neutral-content">
                <span aria-hidden="true" className="material-symbols-outlined">{showPassword ? "visibility" : "visibility_off"}</span>
              </button>
            </div>
          )}
        </RegistrationField>
      </div>

      <ProfileStep />

      <RegistrationField name="acceptTerms" label="Términos de servicio">
        {(accessibility) => (
          <label className="label cursor-pointer justify-start gap-3 text-sm text-neutral-content">
            <input {...register("acceptTerms")} {...accessibility} type="checkbox" className="checkbox checkbox-primary checkbox-sm" />
            Acepto los términos de servicio de NoCountry.
          </label>
        )}
      </RegistrationField>
    </div>
  );
}
