import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PublicLayout } from "../../../shared/layouts/PublicLayout";
import { ActivationStep } from "../components/ActivationStep";
import { ImpactPreview } from "../components/ImpactPreview";
import { OrganizationStep } from "../components/OrganizationStep";
import { ProfileStep } from "../components/ProfileStep";
import { ProjectStep } from "../components/ProjectStep";
import { SubmitToast } from "../components/SubmitToast";
import { WizardSteps } from "../components/WizardSteps";
import {
  challengeDefaultValues,
  challengeSchema,
  type ChallengeFormValues,
} from "../challengeFormSchema";
import { useChallengeWizard } from "../hooks/useChallengeWizard";

const TOAST_DURATION_MS = 5000;

const stepComponents = [ProfileStep, OrganizationStep, ProjectStep, ActivationStep];

export function NewChallengeForm() {
  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeSchema),
    defaultValues: challengeDefaultValues,
  });
  const values = useWatch({ control: form.control }) as ChallengeFormValues;
  const wizard = useChallengeWizard(form.trigger);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [showToast]);

  const onSubmit = (data: ChallengeFormValues) => {
    // TODO: enviar a submissionService cuando el contrato de la API esté definido.
    console.log("Datos listos y validados para enviar a la API:", data);
    setShowToast(true);
    form.reset(challengeDefaultValues);
    wizard.restart();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!wizard.isLastStep) {
      event.preventDefault();
      void wizard.next();
      return;
    }
    void form.handleSubmit(onSubmit)(event);
  };

  const CurrentStep = stepComponents[wizard.stepIndex];

  return (
    <PublicLayout>
      <div className="relative overflow-hidden px-6 py-10 lg:px-8">
        <div className="pointer-events-none absolute -top-40 left-1/4 size-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute right-10 top-1/2 size-80 rounded-full bg-secondary/10 blur-[100px]" />

        <div className="relative mx-auto max-w-360 space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white lg:text-4xl">
              Configura tu <span className="text-gradient">desafío de innovación</span>
            </h1>
            <p className="text-neutral-content">Cuatro pasos para que los equipos empiecen a trabajar en tu proyecto.</p>
          </header>

          <WizardSteps currentStep={wizard.stepIndex} />

          <div className="grid items-start gap-8 lg:grid-cols-12">
            <FormProvider {...form}>
              <form noValidate onSubmit={handleSubmit} className="space-y-6 lg:col-span-8">
                <CurrentStep />

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={wizard.back}
                    disabled={wizard.isFirstStep}
                    className="btn border-neutral bg-base-300"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Atrás
                  </button>

                  {wizard.isLastStep ? (
                    <button type="submit" className="btn bg-brand-gradient border-0 text-white">
                      Publicar desafío
                      <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void wizard.next()}
                      className="btn bg-brand-gradient border-0 text-white"
                    >
                      Siguiente
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              </form>
            </FormProvider>

            <div className="lg:col-span-4">
              <ImpactPreview values={values} furthestStep={wizard.furthestStep} />
            </div>
          </div>
        </div>
      </div>

      <SubmitToast visible={showToast} onClose={() => setShowToast(false)} />
    </PublicLayout>
  );
}
