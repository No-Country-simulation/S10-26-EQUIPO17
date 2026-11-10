import type { ReactNode } from "react";
import {
  countryOptions,
  labelOf,
  orgTypeOptions,
  sectorOptions,
  stageOptions,
  verticalOptions,
} from "../challengeFormOptions";
import type { ChallengeFormValues } from "../challengeFormSchema";
import type { PreviewSection } from "../challengeFlows";

interface ImpactPreviewProps {
  values: ChallengeFormValues;
  // Secciones de los pasos ya alcanzados: aparecen a medida que el usuario avanza.
  visibleSections: PreviewSection[];
}

const benefits = [
  { icon: "groups_3", title: "Acceso a un pool de talento", text: "Perfiles evaluados en dinámicas reales." },
  { icon: "verified", title: "Soluciones validadas", text: "Prototipos funcionales y repositorios limpios." },
  { icon: "devices", title: "Colaboración remota", text: "Sprints semanales con seguimiento observable." },
];

function PreviewBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-content">{label}</p>
      {children}
    </div>
  );
}

function TagList({ items, tone }: { items: string[]; tone: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`badge badge-soft badge-sm ${tone}`}>{item}</span>
      ))}
    </div>
  );
}

export function ImpactPreview({ values, visibleSections }: ImpactPreviewProps) {
  const has = (section: PreviewSection) => visibleSections.includes(section);
  const fullName = [values.firstName, values.lastName].filter(Boolean).join(" ");
  const hasProfile = Boolean(fullName || values.jobPosition);
  const hasProject = Boolean(values.title || values.description || values.vertical);

  return (
    <aside className="space-y-4 rounded-box border border-neutral bg-base-200 p-6 shadow-2xl lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="material-symbols-outlined text-secondary">visibility</span>
          Vista previa del impacto
        </h3>
        <span className="badge badge-soft badge-secondary badge-sm font-bold">EN VIVO</span>
      </div>

      <div className="space-y-4 rounded-box border border-neutral bg-base-300 p-4">
        {!hasProfile && !has("organization") && !has("project") && (
          <p className="text-sm text-neutral-content">
            Completa el formulario y aquí verás cómo se presentará tu desafío.
          </p>
        )}

        {has("profile") && hasProfile && (
          <PreviewBlock label="Representante">
            <p className="font-semibold text-white">{fullName || "Sin nombre"}</p>
            {values.jobPosition && <p className="text-sm text-neutral-content">{values.jobPosition}</p>}
          </PreviewBlock>
        )}

        {has("organization") && (
          <PreviewBlock label="Organización y entorno">
            <p className="font-semibold text-white">{values.companyName || "Empresa sin definir"}</p>
            <p className="text-sm text-white">
              {labelOf(orgTypeOptions, values.organizationType)} · {labelOf(countryOptions, values.country)}
            </p>
            <TagList items={[labelOf(sectorOptions, values.businessSector)]} tone="badge-accent" />
          </PreviewBlock>
        )}

        {has("project") && hasProject && (
          <PreviewBlock label="Proyecto">
            {values.title && <p className="line-clamp-2 font-semibold leading-tight text-white">{values.title}</p>}
            {values.description && (
              <p className="line-clamp-3 text-xs text-neutral-content">{values.description}</p>
            )}
            <span className="badge badge-soft badge-primary badge-sm font-bold">
              Etapa: {labelOf(stageOptions, values.projectStage)}
            </span>
            {values.vertical && (
              <TagList items={[labelOf(verticalOptions, values.vertical)]} tone="badge-secondary" />
            )}
            {values.businessSectors.length > 0 && (
              <TagList
                items={values.businessSectors.map((sector) => labelOf(sectorOptions, sector))}
                tone="badge-accent"
              />
            )}
          </PreviewBlock>
        )}
      </div>

      <span className="badge badge-secondary badge-soft font-bold">Sprint de 5 semanas</span>

      <ul className="space-y-3">
        {benefits.map((benefit) => (
          <li key={benefit.title} className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 text-[20px] text-primary">{benefit.icon}</span>
            <div>
              <h4 className="text-sm font-semibold text-white">{benefit.title}</h4>
              <p className="text-xs text-neutral-content">{benefit.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
