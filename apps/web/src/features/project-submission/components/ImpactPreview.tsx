import type { ReactNode } from "react";
import { orgTypeOptions, stageOptions } from "../challengeFormOptions";
import type { ChallengeFormValues } from "../challengeFormSchema";

interface ImpactPreviewProps {
  values: ChallengeFormValues;
  // Último paso alcanzado: las secciones aparecen a medida que el usuario avanza.
  furthestStep: number;
}

const benefits = [
  { icon: "groups_3", title: "Acceso a un pool de talento", text: "Perfiles evaluados en dinámicas reales." },
  { icon: "verified", title: "Soluciones validadas", text: "Prototipos funcionales y repositorios limpios." },
  { icon: "devices", title: "Colaboración remota", text: "Sprints semanales con seguimiento observable." },
];

function PreviewSection({ label, children }: { label: string; children: ReactNode }) {
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

export function ImpactPreview({ values, furthestStep }: ImpactPreviewProps) {
  const orgType = orgTypeOptions.find((o) => o.value === values.orgType)?.label;
  const stage = stageOptions.find((o) => o.value === values.stage)?.label;
  const hasProfile = Boolean(values.fullName || values.company || values.jobRole);
  const hasProject = Boolean(values.title || values.description || values.verticals.length);

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
        {!hasProfile && furthestStep === 0 && (
          <p className="text-sm text-neutral-content">
            Completa tu perfil y aquí verás cómo se presentará tu desafío.
          </p>
        )}

        {hasProfile && (
          <PreviewSection label="Representante">
            <p className="font-semibold text-white">{values.company || "Empresa sin definir"}</p>
            <p className="text-sm text-neutral-content">
              {[values.fullName, values.jobRole].filter(Boolean).join(" · ")}
            </p>
          </PreviewSection>
        )}

        {furthestStep >= 1 && (
          <PreviewSection label="Organización y entorno">
            <p className="text-sm text-white">
              {orgType} · {values.country}
            </p>
            {values.sectors.length > 0 && <TagList items={values.sectors} tone="badge-accent" />}
          </PreviewSection>
        )}

        {furthestStep >= 2 && hasProject && (
          <PreviewSection label="Proyecto">
            {values.title && <p className="line-clamp-2 font-semibold leading-tight text-white">{values.title}</p>}
            {values.description && (
              <p className="line-clamp-3 text-xs text-neutral-content">{values.description}</p>
            )}
            <span className="badge badge-soft badge-primary badge-sm font-bold">Etapa: {stage}</span>
            {values.verticals.length > 0 && <TagList items={values.verticals} tone="badge-secondary" />}
          </PreviewSection>
        )}

        {furthestStep >= 3 && values.email && (
          <PreviewSection label="Contacto">
            <p className="truncate text-sm text-white">{values.email}</p>
          </PreviewSection>
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
