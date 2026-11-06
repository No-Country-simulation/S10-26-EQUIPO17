import { useFormContext } from "react-hook-form";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { StepCard } from "./StepCard";

const guestBenefits = [
  "Sin requerir tarjeta de crédito.",
  "Aviso por correo cuando el equipo esté listo.",
  "Podrás reclamar la autoría del desafío después.",
];

export function ActivationStep() {
  const { register, formState: { errors } } = useFormContext<ChallengeFormValues>();

  return (
    <StepCard
      stepIndex={3}
      description="Indica el correo donde recibirás las novedades y confirma para publicar tu desafío."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-box border border-neutral bg-base-300 p-5">
          <h3 className="mb-1 flex items-center gap-2 font-bold text-white">
            <span className="material-symbols-outlined text-secondary">flash_on</span>
            Publicación como invitado
          </h3>
          <p className="mb-4 text-xs text-neutral-content">Sin contraseña, en un solo paso.</p>
          <ul className="space-y-2">
            {guestBenefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm text-neutral-content">
                <span className="material-symbols-outlined text-[18px] text-secondary">done</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-sm font-semibold text-white">Correo electrónico</legend>
            <input
              {...register("email")}
              type="email"
              required
              className="input validator w-full"
              placeholder="nombre@empresa.com"
            />
            <p className="validator-hint">
              {errors.email?.message ?? "Ingresa un correo electrónico válido"}
            </p>
          </fieldset>

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
      </div>
    </StepCard>
  );
}
