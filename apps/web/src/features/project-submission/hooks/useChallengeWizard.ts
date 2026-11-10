import { useState } from "react";
import type { UseFormTrigger } from "react-hook-form";
import type { ChallengeFormValues } from "../challengeFormSchema";
import type { WizardStepConfig } from "../challengeFlows";

export function useChallengeWizard(
  trigger: UseFormTrigger<ChallengeFormValues>,
  steps: WizardStepConfig[],
  onStepComplete?: (stepIndex: number) => void,
) {
  const lastStep = steps.length - 1;
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);

  const goTo = (index: number) => {
    setStepIndex(index);
    setFurthestStep((current) => Math.max(current, index));
  };

  const next = async () => {
    const isValid = await trigger(steps[stepIndex].fields);
    if (!isValid || stepIndex >= lastStep) return;
    onStepComplete?.(stepIndex);
    goTo(stepIndex + 1);
  };

  const back = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const restart = () => {
    setStepIndex(0);
    setFurthestStep(0);
  };

  return {
    stepIndex,
    furthestStep,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === lastStep,
    next,
    back,
    restart,
  };
}
