import { useId, useState, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { challengeSchema, type ChallengeFormValues } from "../challengeFormSchema";

type RegistrationFieldName =
  | "email" | "password" | "firstName" | "lastName" | "jobPosition"
  | "acceptTerms" | "companyName" | "organizationType" | "country" | "businessSector";

interface FieldAccessibility {
  "aria-invalid": boolean;
  "aria-describedby"?: string;
}

export function RegistrationField({
  name,
  label,
  hint,
  className = "",
  children,
}: {
  name: RegistrationFieldName;
  label: string;
  hint?: string;
  className?: string;
  children: (accessibility: FieldAccessibility) => ReactNode;
}) {
  const { control, formState: { errors, touchedFields, dirtyFields } } = useFormContext<ChallengeFormValues>();
  const value = useWatch({ control, name });
  const [interacted, setInteracted] = useState(false);
  const messageId = useId();
  const validation = challengeSchema.shape[name].safeParse(value);
  const active = interacted || Boolean(errors[name] || touchedFields[name] || dirtyFields[name]);
  const error = active && !validation.success ? validation.error.issues[0]?.message : undefined;
  const stateClass = !active ? "border-transparent" : error ? "border-error" : "border-success";

  return (
    <fieldset
      className={`fieldset rounded-box border p-3 ${stateClass} ${className}`}
      onChangeCapture={() => setInteracted(true)}
      onBlurCapture={() => setInteracted(true)}
      onClickCapture={(event) => {
        if (event.target instanceof Element && event.target.closest('[role="radio"]')) setInteracted(true);
      }}
    >
      <legend className="fieldset-legend text-sm font-semibold text-white">{label}</legend>
      {children({ "aria-invalid": Boolean(error), "aria-describedby": error || hint ? messageId : undefined })}
      {error ? (
        <p id={messageId} role="alert" className="label text-xs text-error">{error}</p>
      ) : hint ? (
        <p id={messageId} className="label text-xs text-neutral-content">{hint}</p>
      ) : null}
    </fieldset>
  );
}
