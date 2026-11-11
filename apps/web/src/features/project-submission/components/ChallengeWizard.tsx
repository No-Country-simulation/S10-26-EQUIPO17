import { useEffect, useState, type ReactNode } from "react";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PublicLayout } from "../../../shared/layouts/PublicLayout";
import { ApiError } from "../../../shared/api/apiClient";
import { track } from "../../../shared/analytics/analytics";
import {
  challengeDefaultValues,
  type ChallengeFormValues,
} from "../challengeFormSchema";
import type { WizardFlow } from "../challengeFlows";
import { useChallengeWizard } from "../hooks/useChallengeWizard";
import { ImpactPreview } from "./ImpactPreview";
import { SubmitToast } from "./SubmitToast";
import { WizardSteps } from "./WizardSteps";

const TOAST_DURATION_MS = 5000;

interface ChallengeWizardProps {
  flow: WizardFlow;
  heading: ReactNode;
  subtitle: string;
  submitLabel: string;
  submitIcon: string;
  // Si no hay mensaje de éxito no se muestra el toast (p. ej. cuando se redirige a otra ruta).
  successMessage?: string;
  onFirstStepBack?: () => void;
  onSubmit: (values: ChallengeFormValues) => Promise<void>;
}

export function ChallengeWizard({
  flow,
  heading,
  subtitle,
  submitLabel,
  submitIcon,
  successMessage,
  onFirstStepBack,
  onSubmit,
}: ChallengeWizardProps) {
  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(flow.schema) as unknown as Resolver<ChallengeFormValues>,
    defaultValues: challengeDefaultValues,
  });
  const values = useWatch({ control: form.control }) as ChallengeFormValues;
  const wizard = useChallengeWizard(form.trigger, flow.steps, (stepIndex) =>
    track("completed_wizard_step", { flow: flow.id, step: String(stepIndex + 1) }),
  );
  const [showToast, setShowToast] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    track("viewed_wizard", { flow: flow.id });
  }, [flow.id]);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [showToast]);

  const submit = async (data: ChallengeFormValues) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (error) {
      const status = error instanceof ApiError ? String(error.status) : "network";
      track("wizard_submit_failed", { flow: flow.id, status });
      setSubmitError(error instanceof Error ? error.message : "No se pudo completar el envío.");
      return;
    }
    track("submitted_wizard", { flow: flow.id });
    if (successMessage) setShowToast(true);
    form.reset(challengeDefaultValues);
    wizard.restart();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!wizard.isLastStep) {
      event.preventDefault();
      void wizard.next();
      return;
    }
    void form.handleSubmit(submit)(event);
  };

  const step = flow.steps[wizard.stepIndex];
  const CurrentStep = step.Component;
  const visibleSections = flow.steps.slice(0, wizard.furthestStep + 1).flatMap((s) => s.sections);
  const { isSubmitting } = form.formState;

  return (
    <PublicLayout>
      <div className="relative overflow-hidden px-6 py-10 lg:px-8">
        <div className="pointer-events-none absolute -top-40 left-1/4 size-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute right-10 top-1/2 size-80 rounded-full bg-secondary/10 blur-[100px]" />

        <div className="relative mx-auto max-w-360 space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white lg:text-4xl">{heading}</h1>
            <p className="text-neutral-content">{subtitle}</p>
          </header>

          {flow.steps.length > 1 && <WizardSteps steps={flow.steps} currentStep={wizard.stepIndex} />}

          <div className="grid items-start gap-8 lg:grid-cols-12">
            <FormProvider {...form}>
              <form noValidate onSubmit={handleSubmit} className="space-y-6 lg:col-span-8">
                <section className="rounded-box border border-neutral bg-base-200 p-6 shadow-2xl md:p-8">
                  <header className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <span className="badge badge-soft badge-primary mb-2 text-xs font-bold uppercase tracking-wider">
                        Módulo {String(wizard.stepIndex + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-2xl font-bold text-white">
                        Paso {wizard.stepIndex + 1}: {step.title}
                      </h2>
                      <p className="mt-1 text-sm text-neutral-content">{step.description}</p>
                    </div>
                    <div className="grid size-12 shrink-0 place-items-center rounded-box border border-neutral bg-base-300 text-secondary">
                      <span className="material-symbols-outlined text-[28px]">{step.icon}</span>
                    </div>
                  </header>
                  <CurrentStep />
                </section>

                {submitError && (
                  <div role="alert" className="alert alert-error alert-soft">
                    <span className="material-symbols-outlined">error</span>
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={wizard.isFirstStep ? onFirstStepBack : wizard.back}
                    disabled={isSubmitting || (wizard.isFirstStep && !onFirstStepBack)}
                    className="btn border-neutral bg-base-300"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Atrás
                  </button>

                  {wizard.isLastStep ? (
                    <button type="submit" disabled={isSubmitting} className="btn bg-brand-gradient border-0 text-white">
                      {isSubmitting && <span className="loading loading-spinner loading-sm" />}
                      {submitLabel}
                      <span className="material-symbols-outlined text-[20px]">{submitIcon}</span>
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
              <ImpactPreview values={values} visibleSections={visibleSections} />
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <SubmitToast visible={showToast} message={successMessage} onClose={() => setShowToast(false)} />
      )}
    </PublicLayout>
  );
}
