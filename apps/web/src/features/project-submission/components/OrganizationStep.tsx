import { Controller, useFormContext } from "react-hook-form";
import { countryOptions, orgTypeOptions, sectorOptions } from "../challengeFormOptions";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { ChipSelect } from "./ChipSelect";
import { FormField } from "./FormField";
import { OptionCards } from "./OptionCards";
import { StepCard } from "./StepCard";

export function OrganizationStep() {
  const { register, control, formState: { errors } } = useFormContext<ChallengeFormValues>();

  return (
    <StepCard
      stepIndex={1}
      description="Permite calibrar el equipo según el tamaño y la dinámica de trabajo de tu organización."
    >
      <div className="space-y-2">
        <FormField label="Tipo de organización" error={errors.orgType?.message}>
          <Controller
            control={control}
            name="orgType"
            render={({ field }) => (
              <OptionCards
                options={orgTypeOptions}
                value={field.value}
                onChange={field.onChange}
                className="sm:grid-cols-3"
              />
            )}
          />
        </FormField>

        <div className="grid gap-x-4 md:grid-cols-2">
          <FormField label="País sede" error={errors.country?.message}>
            <select {...register("country")} className="select w-full">
              {countryOptions.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Modalidad de intercambio">
            <div className="flex min-h-10 items-center justify-between gap-2 rounded-field border border-neutral bg-base-300 px-3 text-sm text-white">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">wifi_tethering</span>
                100 % remoto asincrónico
              </span>
              <span className="badge badge-soft badge-secondary badge-sm">Activo</span>
            </div>
          </FormField>
        </div>

        <FormField label="Sector / industria" error={errors.sectors?.message} hint="Selecciona uno o más sectores.">
          <Controller
            control={control}
            name="sectors"
            render={({ field }) => (
              <ChipSelect options={sectorOptions} value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>
      </div>
    </StepCard>
  );
}
