import { Controller, useFormContext } from "react-hook-form";
import { countryOptions, orgTypeOptions, sectorOptions } from "../challengeFormOptions";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { FormField } from "./FormField";
import { OptionCards } from "./OptionCards";

export function OrganizationStep() {
  const { register, control, formState: { errors } } = useFormContext<ChallengeFormValues>();

  return (
    <div className="space-y-2">
      <FormField label="Empresa / entidad" error={errors.companyName?.message} hint="Marca o denominación comercial.">
        <input {...register("companyName")} type="text" autoComplete="organization" className="input w-full" placeholder="Ej. NovaTech Solutions" />
      </FormField>

      <FormField label="Tipo de organización" error={errors.organizationType?.message}>
        <Controller
          control={control}
          name="organizationType"
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

        <FormField label="Sector / industria" error={errors.businessSector?.message}>
          <select {...register("businessSector")} className="select w-full">
            {sectorOptions.map((sector) => (
              <option key={sector.value} value={sector.value}>
                {sector.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </div>
  );
}
