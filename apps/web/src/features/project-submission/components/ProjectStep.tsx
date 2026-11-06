import { Controller, useFormContext, useWatch } from "react-hook-form";
import { stageOptions, verticalOptions } from "../challengeFormOptions";
import { DESCRIPTION_MAX_LENGTH, type ChallengeFormValues } from "../challengeFormSchema";
import { ChipSelect } from "./ChipSelect";
import { FormField } from "./FormField";
import { OptionCards } from "./OptionCards";
import { StepCard } from "./StepCard";

export function ProjectStep() {
  const { register, control, formState: { errors } } = useFormContext<ChallengeFormValues>();
  const descriptionLength = useWatch({ control, name: "description" }).length;

  return (
    <StepCard
      stepIndex={2}
      description="Define el objetivo técnico del sprint para armar el equipo multidisciplinario idóneo."
    >
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

        <FormField label="Etapa actual del proyecto" error={errors.stage?.message}>
          <Controller
            control={control}
            name="stage"
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

        <FormField label="Vertical de la solución" error={errors.verticals?.message} hint="Selecciona tus áreas de aplicación.">
          <Controller
            control={control}
            name="verticals"
            render={({ field }) => (
              <ChipSelect options={verticalOptions} value={field.value} onChange={field.onChange} />
            )}
          />
        </FormField>
      </div>
    </StepCard>
  );
}
