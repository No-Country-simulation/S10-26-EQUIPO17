type BadgeVariant = "duration" | "remote" | "start" | "deadline";

const badgeGradients: Record<BadgeVariant, string> = {
  duration: "from-primary to-accent",
  remote: "from-secondary to-accent",
  start: "from-primary to-secondary",
  deadline: "from-accent to-primary",
};

export function Badge({
  variant,
  icon,
  text,
}: {
  variant: BadgeVariant;
  icon: string;
  text: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${badgeGradients[variant]} px-4 py-1.5 text-white shadow-sm`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-sm">
        {icon}
      </span>
      <span className="text-xs font-semibold">{text}</span>
    </span>
  );
}

export function StepNumber({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-md">
        {number}
      </span>
      <div className="flex-1">
        <h3 className="mb-0.5 text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs leading-relaxed text-neutral-content">{description}</p>
      </div>
    </div>
  );
}

export function BenefitItem({
  text,
  checked,
}: {
  text: string;
  checked: boolean;
}) {
  return (
    <li
      className={`flex items-start gap-3 ${
        checked ? "text-base-content/80" : "text-neutral-content/60 line-through"
      }`}
    >
      <span
        aria-hidden="true"
        className={`material-symbols-outlined mt-0.5 size-4 shrink-0 text-base ${
          checked ? "text-secondary" : "text-neutral-content"
        }`}
      >
        {checked ? "check" : "close"}
      </span>
      <span className="text-xs">{text}</span>
    </li>
  );
}
