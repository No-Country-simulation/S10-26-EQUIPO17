import { Controller, useFormContext, useWatch } from "react-hook-form";
import { sectorOptions, stageOptions, verticalOptions } from "../challengeFormOptions";
import { DESCRIPTION_MAX_LENGTH, type ChallengeFormValues } from "../challengeFormSchema";
import { ChipSelect } from "./ChipSelect";
import { FormField } from "./FormField";
import { OptionCards } from "./OptionCards";

export function ProjectStep() {
  const { register, control, formState: { errors } } = useFormContext<ChallengeFormValues>();
  const descriptionLength = useWatch({ control, name: "description" }).length;

  return (
    <div className="space-y-2">
      <FormField label="Título del proyecto" error={errors.title?.message}>
        <input
          {...register("title")}
          type="text"
          className="input w-full"
          placeholder="Ej. Plataforma de analítica IoT y telemetría distribuida"
        />
      </FormField>

      <FormField
        label="Descripción del problema a resolver"
        error={errors.description?.message}
        hint={`${descriptionLength} / ${DESCRIPTION_MAX_LENGTH} caracteres`}
      >
        <textarea
          {...register("description")}
          rows={4}
          maxLength={DESCRIPTION_MAX_LENGTH}
          className="textarea w-full"
          placeholder="Describe la problemática, el usuario objetivo y la hipótesis que quieres validar durante el sprint..."
        />
      </FormField>

      <FormField label="Etapa actual del proyecto" error={errors.projectStage?.message}>
        <Controller
          control={control}
          name="projectStage"
          render={({ field }) => (
            <OptionCards
              options={stageOptions}
              value={field.value}
              onChange={field.onChange}
              className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            />
          )}
        />
      </FormField>

      <FormField label="Vertical de la solución" error={errors.vertical?.message} hint="Selecciona tu área de aplicación.">
        <Controller
          control={control}
          name="vertical"
          render={({ field }) => (
            <OptionCards
              options={verticalOptions}
              value={field.value}
              onChange={field.onChange}
              className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            />
          )}
        />
      </FormField>

      <FormField label="Sectores involucrados" error={errors.businessSectors?.message} hint="Selecciona uno o más sectores.">
        <Controller
          control={control}
          name="businessSectors"
          render={({ field }) => (
            <ChipSelect options={sectorOptions} value={field.value} onChange={field.onChange} />
          )}
        />
      </FormField>
    </div>
  );
}
