import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  errorId?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

export function FormField({ label, error, errorId, hint, optional, className = "", children }: FormFieldProps) {
  return (
    <fieldset className={`fieldset ${className}`}>
      <legend className="fieldset-legend text-sm font-semibold text-white">
        {label}
        {optional && <span className="font-normal text-neutral-content"> (opcional)</span>}
      </legend>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="label text-xs text-error">{error}</p>
      ) : (
        hint && <p className="label text-xs text-neutral-content">{hint}</p>
      )}
    </fieldset>
  );
}
