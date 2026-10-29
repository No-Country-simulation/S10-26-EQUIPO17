import type { ReactNode } from "react";
import type { RoleId } from "../data/landingData";

function MockupFrame({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-neutral bg-base-300 p-6 shadow-xl">{children}</div>;
}

function MockupHeader({ icon, iconClass, title, tag, tagClass }: {
  icon: string;
  iconClass: string;
  title: string;
  tag: string;
  tagClass: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-neutral pb-3">
      <span className="flex items-center gap-2 text-xs font-semibold text-white">
        <span className={`material-symbols-outlined text-[18px] ${iconClass}`}>{icon}</span>
        {title}
      </span>
      <span className={`rounded border px-2.5 py-0.5 text-[11px] font-semibold ${tagClass}`}>{tag}</span>
    </div>
  );
}

const challenges = [
  { name: "Prototipo FinTech B2B", status: "Sprint 4 / 5", statusClass: "text-secondary", progress: 80, meta: "1 PM · 2 Front · 2 Back · 1 UX · 1 QA", action: "Demo lista" },
  { name: "Plataforma Logística AI", status: "Sprint Finalizado", statusClass: "text-primary", progress: 100, meta: "Repositorio entregado + Docs", action: "Descargar MVP" },
];

function CompanyMockup() {
  return (
    <MockupFrame>
      <MockupHeader
        icon="developer_board"
        iconClass="text-secondary"
        title="Squad MVP Delivery Panel"
        tag="Active Challenge"
        tagClass="border-secondary/30 bg-secondary/10 text-secondary"
      />
      <div className="space-y-3">
        {challenges.map((c) => (
          <div key={c.name} className="rounded-xl border border-neutral bg-base-200 p-3.5">
            <div className="mb-1.5 flex justify-between text-xs font-semibold">
              <span className="text-white">{c.name}</span>
              <span className={c.statusClass}>{c.status}</span>
            </div>
            <progress className="progress progress-secondary h-1.5 w-full bg-base-300" value={c.progress} max={100} />
            <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-content">
              <span>{c.meta}</span>
              <span className="font-semibold text-secondary">{c.action}</span>
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function InstitutionMockup() {
  return (
    <MockupFrame>
      <MockupHeader
        icon="analytics"
        iconClass="text-indigo-300"
        title="Cohort Employment Index"
        tag="Bootcamp Partner"
        tagClass="border-accent/30 bg-accent/10 text-indigo-300"
      />
      <div className="space-y-3">
        <div className="rounded-xl border border-neutral bg-base-200 p-3.5">
          <span className="block text-xs text-neutral-content">Inserción en 90 días</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-white">73.6%</span>
            <span className="text-xs font-semibold text-secondary">+31% vs promedio teórico</span>
          </div>
        </div>
        <div className="rounded-xl border border-neutral bg-base-200 p-3.5">
          <span className="block text-xs text-neutral-content">Alumnos evaluados en equipos reales</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-indigo-300">380 estudiantes</span>
            <span className="text-xs text-neutral-content">Cohorte 2024-Q4</span>
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}

function TalentMockup() {
  return (
    <MockupFrame>
      <div className="mb-5 flex items-center gap-3 border-b border-neutral pb-4">
        <div className="grid size-12 place-items-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-md">
          JS
        </div>
        <div>
          <span className="block text-base font-bold text-white">Javier Silva</span>
          <span className="text-xs text-neutral-content">Frontend Developer · Cohort C18 Graduate</span>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral bg-base-200 p-3">
          <span className="text-[11px] font-semibold uppercase text-neutral-content">PRs Merged</span>
          <span className="mt-1 block text-2xl font-extrabold tabular-nums text-secondary">34</span>
        </div>
        <div className="rounded-xl border border-neutral bg-base-200 p-3">
          <span className="text-[11px] font-semibold uppercase text-neutral-content">Team Peer Review</span>
          <span className="mt-1 block text-2xl font-extrabold tabular-nums text-white">4.9 / 5.0</span>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-neutral bg-base-200 p-3">
        <span className="flex items-center gap-1.5 text-xs">
          <span className="material-symbols-outlined text-[18px] text-secondary">verified</span>
          Certificado Hash: NC-C18-9921
        </span>
        <span className="text-xs font-semibold text-secondary">Verificable</span>
      </div>
    </MockupFrame>
  );
}

const mockups: Record<RoleId, () => ReactNode> = {
  empresas: CompanyMockup,
  instituciones: InstitutionMockup,
  talento: TalentMockup,
};

export function RoleMockup({ id }: { id: RoleId }) {
  const Mockup = mockups[id];
  return <Mockup />;
}
