import { labelOf, type SelectOption } from "../../project-submission/challengeFormOptions";

export function OptionBadge({
  options,
  value,
}: {
  options: SelectOption[];
  value: string;
}) {
  const icon = options.find((option) => option.value === value)?.icon;

  return (
    <span className="aura aura-holo ">
      <span className="badge badge-soft badge-primary h-auto gap-2 rounded-xl bg-base-200 py-2 px-1.5">
        {icon && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-base"
          >
            {icon}
          </span>
        )}
        {labelOf(options, value)}
      </span>
    </span>
  );
}
