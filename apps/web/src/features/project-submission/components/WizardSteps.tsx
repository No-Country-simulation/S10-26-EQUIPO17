import type { WizardStepConfig } from "../challengeFlows";

export function WizardSteps({ steps, currentStep }: { steps: WizardStepConfig[]; currentStep: number }) {
  return (
    <div className="rounded-box border border-neutral bg-base-200 p-4 shadow-xl">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-content">
        Paso {currentStep + 1} de {steps.length}
      </p>
      <ul className="steps w-full">
        {steps.map((step, index) => (
          <li
            key={step.title}
            data-content={index < currentStep ? "✓" : index + 1}
            className={`step ${index <= currentStep ? "step-primary" : ""}`}
            aria-current={index === currentStep ? "step" : undefined}
          >
            <span className={`text-xs ${index === currentStep ? "font-semibold text-white" : "text-neutral-content"}`}>
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{step.shortTitle}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
