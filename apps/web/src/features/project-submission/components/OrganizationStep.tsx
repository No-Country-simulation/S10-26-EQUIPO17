import { Controller, useFormContext } from "react-hook-form";
import { countryOptions, orgTypeOptions, sectorOptions } from "../challengeFormOptions";
import type { ChallengeFormValues } from "../challengeFormSchema";
import { RegistrationField } from "./RegistrationField";
import { OptionCards } from "./OptionCards";

export function OrganizationStep() {
  const { register, control } = useFormContext<ChallengeFormValues>();

  return (
    <div className="space-y-2">
      <RegistrationField name="companyName" label="Empresa / entidad" hint="Marca o denominación comercial.">
        {(accessibility) => <input {...register("companyName")} {...accessibility} aria-label="Empresa / entidad" type="text" autoComplete="organization" required className="input validator w-full" placeholder="Ej. NovaTech Solutions" />}
      </RegistrationField>

      <RegistrationField name="organizationType" label="Tipo de organización">
        {(accessibility) => (
        <Controller
          control={control}
          name="organizationType"
          render={({ field }) => (
            <OptionCards
              options={orgTypeOptions}
              value={field.value}
              onChange={field.onChange}
              {...accessibility}
              className="sm:grid-cols-3"
            />
          )}
        />
        )}
      </RegistrationField>

      <div className="grid gap-x-4 md:grid-cols-2">
        <RegistrationField name="country" label="País sede">
          {(accessibility) => <select {...register("country")} {...accessibility} aria-label="País sede" className="select w-full">
            {countryOptions.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>}
        </RegistrationField>

        <RegistrationField name="businessSector" label="Sector / industria">
          {(accessibility) => <select {...register("businessSector")} {...accessibility} aria-label="Sector / industria" className="select w-full">
            {sectorOptions.map((sector) => (
              <option key={sector.value} value={sector.value}>
                {sector.label}
              </option>
            ))}
          </select>}
        </RegistrationField>
      </div>
    </div>
  );
}
