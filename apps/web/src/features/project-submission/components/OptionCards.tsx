import type { SelectOption } from "../challengeFormOptions";

interface OptionCardsProps<T extends string> {
  options: SelectOption<T>[];
  value: string;
  onChange: (value: T) => void;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function OptionCards<T extends string>({ options, value, onChange, className = "", "aria-invalid": invalid, "aria-describedby": describedBy }: OptionCardsProps<T>) {
  return (
    <div role="radiogroup" aria-invalid={invalid} aria-describedby={describedBy} className={`grid gap-3 ${className}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center gap-1 rounded-box border p-3 text-center transition-colors ${
              selected
                ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(255,0,148,0.2)]"
                : "border-neutral bg-base-300 hover:border-secondary"
            }`}
          >
            {option.icon && (
              <span className={`material-symbols-outlined text-[22px] ${selected ? "text-primary" : "text-neutral-content"}`}>
                {option.icon}
              </span>
            )}
            <span className="text-sm font-semibold text-white">{option.label}</span>
            {option.description && <span className="text-xs text-neutral-content">{option.description}</span>}
          </button>
        );
      })}
    </div>
  );
}
