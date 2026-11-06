import type { ReactNode } from "react";
import { wizardSteps } from "../challengeFormOptions";

interface StepCardProps {
  stepIndex: number;
  description: string;
  children: ReactNode;
}

export function StepCard({ stepIndex, description, children }: StepCardProps) {
  const step = wizardSteps[stepIndex];

  return (
    <section className="rounded-box border border-neutral bg-base-200 p-6 shadow-2xl md:p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span className="badge badge-soft badge-primary mb-2 text-xs font-bold uppercase tracking-wider">
            Módulo {String(stepIndex + 1).padStart(2, "0")}
          </span>
          <h2 className="text-2xl font-bold text-white">
            Paso {stepIndex + 1}: {step.title}
          </h2>
          <p className="mt-1 text-sm text-neutral-content">{description}</p>
        </div>
        <div className="grid size-12 shrink-0 place-items-center rounded-box border border-neutral bg-base-300 text-secondary">
          <span className="material-symbols-outlined text-[28px]">{step.icon}</span>
        </div>
      </header>
      {children}
    </section>
  );
}
