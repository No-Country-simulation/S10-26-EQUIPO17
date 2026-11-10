import type { SelectOption } from "../challengeFormOptions";

interface ChipSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function ChipSelect({ options, value, onChange }: ChipSelectProps) {
  const toggle = (optionValue: string) =>
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option.value)}
            className={`btn btn-sm rounded-full ${
              selected ? "btn-secondary" : "border-neutral bg-base-300 text-neutral-content hover:border-secondary"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{selected ? "check" : option.icon}</span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
